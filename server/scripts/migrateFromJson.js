import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load server .env
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
dotenv.config();

// Import models
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import Feedback from "../models/Feedback.js";
import { sanitizeMongoUri } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");
const DEFAULT_SOURCE_PATH = path.join(DATA_DIR, "db.json");
const DEFAULT_BACKUP_DIR = path.join(DATA_DIR, "backups");

/**
 * Resolve migration source path cross-platform relative to project/script location
 */
export function resolveSourcePath(customPath) {
  if (customPath) {
    return path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
  }
  if (process.env.MIGRATION_SOURCE_PATH) {
    const envPath = process.env.MIGRATION_SOURCE_PATH;
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
  }
  return DEFAULT_SOURCE_PATH;
}

/**
 * Creates an immutable timestamped backup of the JSON source file
 */
export function createBackup(sourcePath = DEFAULT_SOURCE_PATH, backupDir = DEFAULT_BACKUP_DIR) {
  const resolvedSource = resolveSourcePath(sourcePath);
  const resolvedBackupDir = path.isAbsolute(backupDir) ? backupDir : path.resolve(process.cwd(), backupDir);

  if (!fs.existsSync(resolvedSource)) {
    throw new Error(`Migration source file not found at: ${resolvedSource}`);
  }

  if (!fs.existsSync(resolvedBackupDir)) {
    fs.mkdirSync(resolvedBackupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(resolvedBackupDir, `db-backup-${timestamp}.json`);

  const content = fs.readFileSync(resolvedSource);
  fs.writeFileSync(backupFile, content);
  const sha256 = crypto.createHash("sha256").update(content).digest("hex");

  return { path: backupFile, sha256, bytes: content.length };
}

/**
 * Deterministic booking reference from legacy ID.
 * Uses a stable hash so re-runs produce the same reference.
 * Format: SE-XXXXXXXX (8 alphanumeric chars)
 */
function deterministicReference(legacyId) {
  const h = crypto.createHash("sha256").update(String(legacyId)).digest("hex");
  // Take first 8 hex chars → upper-case → prefix SE-
  return "SE-" + h.substring(0, 8).toUpperCase();
}

/**
 * Main migration runner
 * OPTIONS:
 *   dryRun  – true means zero writes to Atlas
 *   uri     – override MONGODB_URI
 */
export async function runMigration(options = {}) {
  const isDryRun = options.dryRun ?? process.argv.includes("--dry-run");
  const mongoUri = options.uri || process.env.MONGODB_URI;
  const sourcePath = resolveSourcePath(options.sourcePath);
  const backupDir = options.backupDir || process.env.MIGRATION_BACKUP_DIR || DEFAULT_BACKUP_DIR;

  if (!mongoUri) {
    throw new Error("❌ MONGODB_URI is not set. A valid MongoDB Atlas connection string is required.");
  }

  const summary = {
    dryRun: isDryRun,
    timestamp: new Date().toISOString(),
    sourceFile: sourcePath,
    backup: null,
    backupPath: null,
    sourceSha256: null,
    users:     { scanned: 0, migrated: 0, skipped: 0, failed: 0, errors: [] },
    hotels:    { scanned: 0, migrated: 0, skipped: 0, failed: 0, errors: [] },
    rooms:     { scanned: 0, migrated: 0, skipped: 0, failed: 0, errors: [] },
    bookings:  { scanned: 0, migrated: 0, skipped: 0, failed: 0, errors: [] },
    feedbacks: { scanned: 0, migrated: 0, skipped: 0, failed: 0, errors: [] },
  };

  console.log("\n============================================================");
  console.log(`📦 STAYEASE MIGRATION: JSON -> MONGODB`);
  console.log(`Mode:    ${isDryRun ? "🔍 DRY-RUN (Zero writes to Atlas)" : "🚀 LIVE MIGRATION"}`);
  console.log(`Target:  ${sanitizeMongoUri(mongoUri)}`);
  console.log(`Source:  ${sourcePath}`);
  console.log("============================================================\n");

  // 1. Validate source
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Migration source file does not exist at ${sourcePath}`);
  }

  const rawBuffer = fs.readFileSync(sourcePath);
  summary.sourceSha256 = crypto.createHash("sha256").update(rawBuffer).digest("hex");
  let dbData;
  try {
    dbData = JSON.parse(rawBuffer.toString("utf8"));
  } catch (parseErr) {
    throw new Error(`Invalid JSON in migration source ${sourcePath}: ${parseErr.message}`);
  }

  if (!dbData || typeof dbData !== "object" || Array.isArray(dbData)) {
    throw new Error(`Invalid migration source structure in ${sourcePath}: expected JSON object.`);
  }

  // Record source counts
  const srcCounts = {
    users:     (dbData.users     || []).length,
    hotels:    (dbData.hotels    || []).length,
    bookings:  (dbData.bookings  || []).length,
    feedbacks: (dbData.feedbacks || []).length,
  };
  console.log("📊 Source record counts:");
  Object.entries(srcCounts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
  console.log(`   SHA-256: ${summary.sourceSha256}\n`);

  // 2. Create backup (live mode only)
  if (!isDryRun) {
    summary.backup = createBackup(sourcePath, backupDir);
    summary.backupPath = summary.backup.path;
    console.log(`🛡️  Backup created: ${summary.backup.path}`);
    console.log(`   SHA-256: ${summary.backup.sha256}\n`);
  } else {
    console.log("🛡️  [DRY-RUN] Backup skipped (no-write mode).\n");
  }

  // 3. Connect to MongoDB Atlas
  const isExistingConnection = mongoose.connection.readyState === 1;
  if (!isExistingConnection) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log(`✅ Connected to MongoDB Atlas: "${mongoose.connection.name}" on ${mongoose.connection.host}\n`);
  }

  // Check existing Atlas counts
  const atlasCounts = {
    users:     await User.countDocuments(),
    hotels:    await Hotel.countDocuments(),
    rooms:     await Room.countDocuments(),
    bookings:  await Booking.countDocuments(),
    feedbacks: await Feedback.countDocuments(),
  };
  console.log("📊 Existing Atlas record counts:");
  Object.entries(atlasCounts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
  console.log("");

  // In-memory ID maps: legacyId -> MongoDB ObjectId
  const userMap  = new Map(); // legacyId | email -> _id
  const hotelMap = new Map(); // legacyId (Number) -> _id
  const roomMap  = new Map(); // `${hotelLegacyId}-${type}` -> _id

  try {
    // ─────────────────────────────────────────────
    // A. MIGRATE USERS
    // ─────────────────────────────────────────────
    const users = dbData.users || [];
    summary.users.scanned = users.length;
    console.log(`👤 Processing ${users.length} Users...`);

    for (const u of users) {
      try {
        const legacyId = String(u.id || "");
        const email    = (u.email || "").toLowerCase().trim();
        const username = (u.username || "").toLowerCase().trim();
        const isDemo   = legacyId.includes("demo") || username.includes("demo") || email.includes("stayease.com");

        // Check existing
        const existing = await User.findOne({
          $or: [
            ...(legacyId ? [{ legacyId }] : []),
            ...(email    ? [{ email }]    : []),
          ],
        });

        if (existing) {
          summary.users.skipped++;
          userMap.set(legacyId, existing._id);
          if (email) userMap.set(email, existing._id);
          console.log(`   ↷ Skipped (already in Atlas): ${username} [${email}]`);
          continue;
        }

        // Validate password hash — never re-hash an already-hashed bcrypt string
        const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(u.password || "");
        if (!u.password || !isBcrypt) {
          throw new Error(`User ${username}: password is missing or not a valid bcrypt hash.`);
        }

        const userDoc = new User({
          legacyId,
          isDemo,
          name:          u.name     || username || "Guest",
          username:      username   || `user_${Date.now()}`,
          email,
          password:      u.password, // bcrypt hash — pre-save hook preserves it
          phone:         u.phone    || "",
          dateOfBirth:   u.dateOfBirth ? new Date(u.dateOfBirth) : undefined,
          city:          u.city     || "",
          avatar:        u.avatar   || "",
          role:          u.role     || "user",
          loyaltyPoints: u.loyaltyPoints ?? 100,
          tier:          u.tier     || "Silver Explorer",
          isActive:      u.isActive ?? true,
          createdAt:     u.createdAt ? new Date(u.createdAt) : undefined,
        });

        // Validate before writing (dry-run still validates)
        await userDoc.validate();

        if (!isDryRun) {
          await userDoc.save();
        }

        userMap.set(legacyId, userDoc._id);
        if (email) userMap.set(email, userDoc._id);

        summary.users.migrated++;
        console.log(`   ✓ ${isDryRun ? "[DRY] " : ""}Migrated user: ${username} (${email}) [role: ${u.role || "user"}]`);
      } catch (err) {
        summary.users.failed++;
        summary.users.errors.push({ id: u.id, email: u.email, error: err.message });
        console.error(`   ✗ Error on user ${u.username || u.id}: ${err.message}`);
      }
    }

    // ─────────────────────────────────────────────
    // B. MIGRATE HOTELS
    // ─────────────────────────────────────────────
    const hotels = dbData.hotels || [];
    summary.hotels.scanned = hotels.length;
    console.log(`\n🏨 Processing ${hotels.length} Hotels...`);

    // Build ownership map: email -> Atlas _id (from already-migrated or existing users)
    // JSON db: riya is the owner. Try to resolve her _id.
    const ownerEmailMap = new Map();
    for (const u of (dbData.users || [])) {
      const email = (u.email || "").toLowerCase().trim();
      if (email) {
        const atlasUser = await User.findOne({ email });
        if (atlasUser) ownerEmailMap.set(email, atlasUser._id);
      }
    }

    // Default owner = riya (owner role), fallback to admin, then first user
    const riyaEmail = "riyamakker34@gmail.com";
    const riyaId    = ownerEmailMap.get(riyaEmail) || userMap.get(riyaEmail);
    const adminUser = await User.findOne({ role: "admin" });
    const anyUser   = await User.findOne();
    const defaultOwnerId = riyaId || adminUser?._id || anyUser?._id;
    console.log(`   Default owner for hotels without mapped owner: ${defaultOwnerId || "NONE (no users yet)"}`);

    for (const h of hotels) {
      try {
        const legacyId = Number(h.id);
        const name     = (h.name || "").trim();
        const city     = (h.city || "Goa").trim();

        // Determine correct owner
        // The 3 properties assigned to riya previously:
        const riyaHotels = ["Coastal Palm Retreat", "Lakeview Heritage Palace", "Pine Valley Escape"];
        const ownerId = riyaHotels.includes(name) ? (riyaId || defaultOwnerId) : defaultOwnerId;

        // Check existing (by legacyId first, then name+city)
        const existing = await Hotel.findOne({
          $or: [
            ...(legacyId ? [{ legacyId }] : []),
            { name, "location.city": city },
            { name, city },
          ],
        });

        if (existing) {
          summary.hotels.skipped++;
          hotelMap.set(legacyId, existing._id);
          console.log(`   ↷ Skipped (already in Atlas): "${name}" (${city})`);
        } else {
          const locationStr = typeof h.location === "string"
            ? h.location
            : (h.location?.address || `${city}, India`);

          const hotelDoc = new Hotel({
            legacyId: legacyId || undefined,
            isDemo:   false,
            name,
            description:    h.description || `${name} in ${city}.`,
            category:       "hotel",
            ownerId,
            approvalStatus: "approved",
            isActive:       true,
            city,
            location: {
              address: locationStr,
              city,
              country: "India",
            },
            price:       Number(h.price)  || 3000,
            starRating:  Math.min(5, Math.max(1, Math.round(Number(h.rating) || 4))),
            rating:      Number(h.rating) || 4.5,
            reviewCount: 15,
            image:       h.image || "",
            images:      h.image ? [h.image] : [],
            amenities:   Array.isArray(h.amenities) ? h.amenities : ["Free Wi-Fi", "Swimming Pool"],
          });

          await hotelDoc.validate();

          if (!isDryRun) {
            await hotelDoc.save();
          }

          hotelMap.set(legacyId, hotelDoc._id);
          summary.hotels.migrated++;
          console.log(`   ✓ ${isDryRun ? "[DRY] " : ""}Migrated hotel: "${name}" (${city}) owner:${ownerId}`);
        }

        const hotelMongoId = hotelMap.get(legacyId);

        // Auto-create 3 standard room types per hotel
        const roomTemplates = [
          { type: "deluxe",   name: "Deluxe King Room",  bed: "1 King Bed",    capacity: { adults: 2, children: 1 }, mult: 1.0,  inv: 10 },
          { type: "standard", name: "Twin Bed Room",     bed: "2 Twin Beds",   capacity: { adults: 2, children: 0 }, mult: 0.9,  inv: 8  },
          { type: "suite",    name: "Executive Suite",   bed: "1 King Bed",    capacity: { adults: 3, children: 1 }, mult: 1.5,  inv: 5  },
        ];

        for (const tmpl of roomTemplates) {
          summary.rooms.scanned++;
          const legacyRoomKey = `${legacyId}-${tmpl.type}`;

          const existingRoom = await Room.findOne({ hotelId: hotelMongoId, type: tmpl.type });
          if (existingRoom) {
            summary.rooms.skipped++;
            roomMap.set(legacyRoomKey, existingRoom._id);
            continue;
          }

          const basePrice = Math.round((Number(h.price) || 4000) * tmpl.mult);
          const roomDoc = new Room({
            legacyId:         legacyRoomKey,
            hotelId:          hotelMongoId,
            name:             tmpl.name,
            type:             tmpl.type,
            bedConfiguration: tmpl.bed,
            capacity:         tmpl.capacity,
            basePrice,
            totalInventory:   tmpl.inv,
            amenities:        ["Air Conditioning", "Free Wi-Fi", "Ensuite Bathroom", "Smart TV"],
            isActive:         true,
          });

          await roomDoc.validate();

          if (!isDryRun) {
            await roomDoc.save();
            roomMap.set(legacyRoomKey, roomDoc._id);
          } else {
            roomMap.set(legacyRoomKey, roomDoc._id);
          }

          summary.rooms.migrated++;
        }
      } catch (err) {
        summary.hotels.failed++;
        summary.hotels.errors.push({ id: h.id, name: h.name, error: err.message });
        console.error(`   ✗ Error on hotel "${h.name}": ${err.message}`);
      }
    }

    // ─────────────────────────────────────────────
    // C. MIGRATE BOOKINGS
    // ─────────────────────────────────────────────
    const bookings = dbData.bookings || [];
    summary.bookings.scanned = bookings.length;
    console.log(`\n📋 Processing ${bookings.length} Bookings...`);

    for (const b of bookings) {
      try {
        const legacyId = String(b.id || "");
        // DETERMINISTIC reference — same input always produces same output
        const reference = b.reference
          ? b.reference.trim().toUpperCase()
          : deterministicReference(legacyId || JSON.stringify(b));

        const isDemo = legacyId.includes("demo") || (b.userEmail && b.userEmail.includes("stayease.com"));

        // Check existing
        const existing = await Booking.findOne({
          $or: [
            ...(legacyId  ? [{ legacyId }]  : []),
            ...(reference ? [{ reference }] : []),
          ],
        });

        if (existing) {
          summary.bookings.skipped++;
          console.log(`   ↷ Skipped (already in Atlas): ${reference}`);
          continue;
        }

        // Resolve hotel reference — REQUIRED, never skip
        const targetHotelId =
          hotelMap.get(Number(b.hotelId)) ||
          (await Hotel.findOne({ legacyId: Number(b.hotelId) }))?._id;

        if (!targetHotelId) {
          throw new Error(`hotelId ${b.hotelId} not found in Atlas. Cannot migrate booking ${reference}.`);
        }

        // Resolve user reference — REQUIRED, never assign arbitrary default
        const userEmail    = (b.userEmail || b.email || "").toLowerCase().trim();
        const targetUserId =
          userMap.get(String(b.userId || "")) ||
          userMap.get(userEmail)              ||
          (await User.findOne({ email: userEmail }))?._id;

        if (!targetUserId && !b.userId) {
          throw new Error(`No user reference found for booking ${reference} (userId: ${b.userId}, email: ${userEmail}). Will not fabricate.`);
        }
        if (!targetUserId) {
          throw new Error(`userId ${b.userId} / email ${userEmail} not found in Atlas. Cannot migrate booking ${reference}.`);
        }

        // Resolve room reference — look for existing room first
        const legacyRoomKey = `${b.hotelId}-${b.roomId?.split("-").slice(-1)[0] || "standard"}`;
        let targetRoomId =
          roomMap.get(legacyRoomKey) ||
          (await Room.findOne({ hotelId: targetHotelId }))?._id;

        if (!targetRoomId) {
          // This should not happen after hotel migration created rooms
          throw new Error(`No room found for hotel ${b.hotelId}. Cannot migrate booking ${reference} without fabricating data.`);
        }

        const subtotal = Number(b.subtotal) || Number(b.total) || 5000;
        const taxes    = Number(b.taxes)    || Math.round(subtotal * 0.12);
        const total    = Number(b.total)    || (subtotal + taxes);

        // Status normalization
        const statusMap = {
          confirmed:  "confirmed",
          cancelled:  "cancelled",
          canceled:   "cancelled",
          pending:    "pending",
          completed:  "completed",
          "no-show":  "no-show",
        };
        const rawStatus  = (b.status || "confirmed").toLowerCase();
        const normStatus = statusMap[rawStatus] || "confirmed";

        const bookingDoc = new Booking({
          legacyId: legacyId || undefined,
          isDemo,
          reference,
          userId:    targetUserId,
          hotelId:   targetHotelId,
          roomId:    targetRoomId,
          hotelName:  b.hotelName  || "",
          hotelCity:  b.hotelCity  || "",
          hotelImage: b.hotelImage || "",
          roomName:   b.roomName   || "",
          roomPrice:  Number(b.roomPrice) || 0,
          subtotal,
          taxes,
          total,
          guestDetails: {
            name:  b.guestName || "Guest",
            email: (b.email || b.userEmail || "guest@stayease.com").toLowerCase(),
            phone: b.phone || "+91 9876543210",
          },
          checkIn:  new Date(b.checkIn),
          checkOut: new Date(b.checkOut),
          rooms:  Number(b.rooms)  || 1,
          guests: Number(b.guests) || 2,
          nights: Number(b.nights) || 1,
          pricing: {
            baseAmount:        subtotal,
            taxes,
            totalAmount:       total,
            weekendSurcharge:  0,
            seasonalSurcharge: 0,
            couponDiscount:    0,
            pointsDiscount:    0,
          },
          status:    normStatus,
          createdAt: b.createdAt ? new Date(b.createdAt) : undefined,
        });

        await bookingDoc.validate();

        if (!isDryRun) {
          await bookingDoc.save();
        }

        summary.bookings.migrated++;
        console.log(`   ✓ ${isDryRun ? "[DRY] " : ""}Migrated booking: ${reference} [${normStatus}] user:${targetUserId}`);
      } catch (err) {
        summary.bookings.failed++;
        summary.bookings.errors.push({ id: b.id, ref: b.reference, error: err.message });
        console.error(`   ✗ Error on booking ${b.reference || b.id}: ${err.message}`);
      }
    }

    // ─────────────────────────────────────────────
    // D. MIGRATE FEEDBACKS
    // ─────────────────────────────────────────────
    const feedbacks = dbData.feedbacks || [];
    summary.feedbacks.scanned = feedbacks.length;
    console.log(`\n💬 Processing ${feedbacks.length} Feedbacks...`);

    for (const f of feedbacks) {
      try {
        const legacyId = String(f.id || "");

        const existing = await Feedback.findOne({
          $or: [
            ...(legacyId ? [{ legacyId }] : []),
            { name: f.name, comment: f.comment },
          ],
        });

        if (existing) {
          summary.feedbacks.skipped++;
          console.log(`   ↷ Skipped (already in Atlas): ${f.name}`);
          continue;
        }

        const feedbackDoc = new Feedback({
          legacyId: legacyId || undefined,
          isDemo:   legacyId.startsWith("fb_"),
          name:       f.name      || "Verified Guest",
          location:   f.location  || "India",
          rating:     Number(f.rating) || 5,
          hotelStayed: f.hotelStayed  || "StayEase Property",
          comment:    f.comment,
          avatar:     f.avatar   || "",
          date:       f.date     || "Recent",
          badge:      f.badge    || "Verified Guest",
          createdAt:  f.createdAt ? new Date(f.createdAt) : undefined,
        });

        await feedbackDoc.validate();

        if (!isDryRun) {
          await feedbackDoc.save();
        }

        summary.feedbacks.migrated++;
        console.log(`   ✓ ${isDryRun ? "[DRY] " : ""}Migrated feedback: ${f.name}`);
      } catch (err) {
        summary.feedbacks.failed++;
        summary.feedbacks.errors.push({ id: f.id, name: f.name, error: err.message });
        console.error(`   ✗ Error on feedback ${f.name}: ${err.message}`);
      }
    }

    // ─────────────────────────────────────────────
    // E. PRINT SUMMARY
    // ─────────────────────────────────────────────
    console.log("\n============================================================");
    console.log(`📊 MIGRATION SUMMARY  [${isDryRun ? "DRY-RUN – No data written" : "LIVE"}]`);
    console.log("============================================================");

    for (const col of ["users", "hotels", "rooms", "bookings", "feedbacks"]) {
      const s = summary[col];
      const label = col.padEnd(10);
      console.log(
        `${label}: Scanned ${s.scanned} | Migrated ${s.migrated} | Skipped ${s.skipped} | Failed ${s.failed || 0}`
      );
      if (s.errors && s.errors.length > 0) {
        s.errors.forEach((e) => console.error(`   ⚠ ${e.error}`));
      }
    }

    if (summary.backup) {
      console.log(`\nBackup:    ${summary.backup.path}`);
      console.log(`Src SHA:   ${summary.sourceSha256}`);
    }

    const hasFailures = ["users", "hotels", "bookings", "feedbacks"].some(
      (c) => (summary[c].failed || 0) > 0
    );

    if (hasFailures) {
      console.log("\n⚠️  MIGRATION COMPLETED WITH ERRORS — review failures above before proceeding.");
    } else {
      console.log(
        isDryRun
          ? "\n✅ DRY-RUN COMPLETE — no data written. All records validated successfully."
          : "\n✅ LIVE MIGRATION COMPLETE — all records migrated successfully."
      );
    }
    console.log("============================================================\n");

    return summary;
  } finally {
    if (!isExistingConnection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Allow CLI: node server/scripts/migrateFromJson.js [--dry-run]
if (process.argv[1] && process.argv[1].endsWith("migrateFromJson.js")) {
  runMigration().catch((err) => {
    console.error("❌ Migration failed with fatal error:", err.message || err);
    process.exit(1);
  });
}

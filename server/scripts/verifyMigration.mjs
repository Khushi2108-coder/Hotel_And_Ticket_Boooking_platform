/**
 * STAYEASE – Post-Migration Verification Script
 * Independently reads from MongoDB Atlas and cross-checks against db.json source.
 * Zero writes to Atlas.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
dotenv.config();

import User     from "../models/User.js";
import Hotel    from "../models/Hotel.js";
import Room     from "../models/Room.js";
import Booking  from "../models/Booking.js";
import Feedback from "../models/Feedback.js";
import { sanitizeMongoUri } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Read from archive (db.json has been retired from active runtime path)
const ARCHIVE_DIR = path.join(__dirname, "../archive/legacy-data");
const DB_JSON_CANDIDATES = fs.readdirSync(ARCHIVE_DIR)
  .filter((f) => f.endsWith(".json") && !f.endsWith(".archived"))
  .sort()
  .reverse(); // most recent first

const DB_JSON = DB_JSON_CANDIDATES.length > 0
  ? path.join(ARCHIVE_DIR, DB_JSON_CANDIDATES[0])
  : null;

async function verify() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set.");

  if (!DB_JSON) throw new Error("No archived db.json found in server/archive/legacy-data/");

  console.log("\n============================================================");
  console.log("🔍 STAYEASE – POST-MIGRATION VERIFICATION");
  console.log(`   Atlas:   ${sanitizeMongoUri(uri)}`);
  console.log(`   Archive: ${path.basename(DB_JSON)}`);
  console.log("============================================================\n");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅ Atlas connected: "${mongoose.connection.name}" on ${mongoose.connection.host}\n`);

  const src = JSON.parse(fs.readFileSync(DB_JSON, "utf8"));
  const srcSha = crypto.createHash("sha256").update(fs.readFileSync(DB_JSON)).digest("hex");

  // ── USERS ──────────────────────────────────────────────────────────
  console.log("👤 USERS");
  const atlasUsers = await User.find().select("-password -refreshToken -resetPasswordToken").lean();
  console.log(`   Source: ${src.users.length}  |  Atlas: ${atlasUsers.length}`);
  for (const u of src.users) {
    const found = atlasUsers.find(
      (a) => a.email === u.email?.toLowerCase() || a.legacyId === String(u.id)
    );
    console.log(
      found
        ? `   ✓ ${u.username} (${u.email}) → Atlas _id: ${found._id} [role: ${found.role}]`
        : `   ✗ MISSING: ${u.username} (${u.email})`
    );
  }

  // ── HOTELS ─────────────────────────────────────────────────────────
  console.log("\n🏨 HOTELS");
  const atlasHotels = await Hotel.find().lean();
  console.log(`   Source: ${src.hotels.length}  |  Atlas: ${atlasHotels.length}`);
  let hotelOk = 0, hotelMissing = 0;
  for (const h of src.hotels) {
    const found = atlasHotels.find(
      (a) => a.legacyId === Number(h.id) || a.name === h.name
    );
    if (found) { hotelOk++; }
    else       { hotelMissing++; console.log(`   ✗ MISSING: "${h.name}" (${h.city})`); }
  }
  console.log(`   ✓ ${hotelOk} matched  ✗ ${hotelMissing} missing`);

  // ── ROOMS ──────────────────────────────────────────────────────────
  const atlasRooms = await Room.countDocuments();
  console.log(`\n🛏  ROOMS`);
  console.log(`   Atlas: ${atlasRooms} (auto-created: 3 per hotel × ${atlasHotels.length} = ${atlasHotels.length * 3} expected)`);

  // ── BOOKINGS ───────────────────────────────────────────────────────
  console.log("\n📋 BOOKINGS");
  const atlasBookings = await Booking.find().lean();
  console.log(`   Source: ${src.bookings.length}  |  Atlas: ${atlasBookings.length}`);
  for (const b of src.bookings) {
    const ref   = (b.reference || "").toUpperCase().trim();
    const found = atlasBookings.find(
      (a) => a.reference === ref || a.legacyId === String(b.id)
    );
    if (found) {
      // Verify user+hotel references
      const userOk  = found.userId !== null && found.userId !== undefined;
      const hotelOk = found.hotelId !== null && found.hotelId !== undefined;
      const roomOk  = found.roomId  !== null && found.roomId  !== undefined;
      console.log(
        `   ✓ ${ref} [${found.status}] user:${userOk ? "✓" : "✗"}  hotel:${hotelOk ? "✓" : "✗"}  room:${roomOk ? "✓" : "✗"}`
      );
    } else {
      console.log(`   ✗ MISSING: ${ref}`);
    }
  }

  // ── FEEDBACKS ──────────────────────────────────────────────────────
  console.log("\n💬 FEEDBACKS");
  const atlasFeedbacks = await Feedback.find().lean();
  console.log(`   Source: ${src.feedbacks.length}  |  Atlas: ${atlasFeedbacks.length}`);
  for (const f of src.feedbacks) {
    const found = atlasFeedbacks.find((a) => a.name === f.name || a.legacyId === String(f.id));
    console.log(
      found
        ? `   ✓ ${f.name} [rating: ${found.rating}]`
        : `   ✗ MISSING: ${f.name}`
    );
  }

  // ── SUMMARY ────────────────────────────────────────────────────────
  console.log("\n============================================================");
  console.log("📊 RECONCILIATION TABLE");
  console.log("============================================================");
  console.log("Collection  | Source | Atlas  | Status");
  console.log("------------|--------|--------|-------");
  console.log(`Users       | ${String(src.users.length).padEnd(6)} | ${String(atlasUsers.length).padEnd(6)} | ${atlasUsers.length >= src.users.length ? "✅" : "⚠️"}`);
  console.log(`Hotels      | ${String(src.hotels.length).padEnd(6)} | ${String(atlasHotels.length).padEnd(6)} | ${atlasHotels.length >= src.hotels.length ? "✅" : "⚠️"}`);
  console.log(`Rooms       | auto   | ${String(atlasRooms).padEnd(6)} | ${atlasRooms >= atlasHotels.length * 3 ? "✅" : "⚠️"}`);
  console.log(`Bookings    | ${String(src.bookings.length).padEnd(6)} | ${String(atlasBookings.length).padEnd(6)} | ${atlasBookings.length >= src.bookings.length ? "✅" : "⚠️"}`);
  console.log(`Feedbacks   | ${String(src.feedbacks.length).padEnd(6)} | ${String(atlasFeedbacks.length).padEnd(6)} | ${atlasFeedbacks.length >= src.feedbacks.length ? "✅" : "⚠️"}`);
  console.log(`\nSource SHA-256: ${srcSha}`);
  console.log("============================================================\n");

  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error("❌ Verification failed:", err.message);
  process.exit(1);
});

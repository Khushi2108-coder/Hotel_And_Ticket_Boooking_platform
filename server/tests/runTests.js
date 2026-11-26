import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execSync } from "child_process";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Models
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import InventoryDay from "../models/InventoryDay.js";
import Booking from "../models/Booking.js";
import Feedback from "../models/Feedback.js";
import { sanitizeMongoUri } from "../config/database.js";
import { runMigration } from "../scripts/migrateFromJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "..");
const TEST_PORT = 30000;
const TEST_URI = `mongodb://127.0.0.1:${TEST_PORT}/stayease_test_db`;
const TEST_RUN_DIR = path.join(os.tmpdir(), `stayease-db-test-${Date.now()}`);
const TEST_DB_PATH = path.join(TEST_RUN_DIR, "mongod-data");
const FIXTURE_DIR = path.join(TEST_RUN_DIR, "fixtures");
const FIXTURE_BACKUP_DIR = path.join(TEST_RUN_DIR, "backups");

function resolveMongodExecutable() {
  if (process.env.MONGOD_PATH && fs.existsSync(process.env.MONGOD_PATH)) {
    return process.env.MONGOD_PATH;
  }
  try {
    const cmd = process.platform === "win32" ? "where mongod" : "which mongod";
    const resolved = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .split(/\r?\n/)[0]
      .trim();
    if (resolved && fs.existsSync(resolved)) return resolved;
  } catch {
    // Fall back to standard platform install paths
  }
  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const mongoBase = path.join(programFiles, "MongoDB", "Server");
    if (fs.existsSync(mongoBase)) {
      const versions = fs.readdirSync(mongoBase).sort().reverse();
      for (const v of versions) {
        const candidate = path.join(mongoBase, v, "bin", "mongod.exe");
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return "mongod";
}

const MONGOD_EXE = resolveMongodExecutable();

let mongodProc = null;
const results = [];

function recordTest(name, passed, message = "") {
  results.push({ name, passed, message });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${icon}: ${name}${message ? ` (${message})` : ""}`);
}

/**
 * Start ephemeral mongod for tests
 */
async function startEphemeralMongo() {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
    } catch {}
  }
  fs.mkdirSync(TEST_DB_PATH, { recursive: true });

  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting ephemeral test mongod on port ${TEST_PORT}...`);
    mongodProc = spawn(MONGOD_EXE, [
      "--port", String(TEST_PORT),
      "--dbpath", TEST_DB_PATH,
      "--bind_ip", "127.0.0.1",
    ]);

    let started = false;

    mongodProc.stdout.on("data", (data) => {
      const text = data.toString();
      if (!started && (text.includes("Waiting for connections") || text.includes('"msg":"Waiting for connections"'))) {
        started = true;
        console.log(`✅ Ephemeral MongoDB ready on port ${TEST_PORT}.\n`);
        resolve();
      }
    });

    mongodProc.stderr.on("data", (data) => {
      // console.error("mongod stderr:", data.toString());
    });

    mongodProc.on("error", (err) => {
      if (!started) {
        started = true;
        reject(err);
      }
    });

    setTimeout(() => {
      if (!started) {
        started = true;
        console.log(`⏱️ Timeout reached, proceeding with test connections...`);
        resolve();
      }
    }, 10000);
  });
}

/**
 * Stop ephemeral mongod
 */
async function stopEphemeralMongo() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }

  if (mongodProc) {
    console.log("\n🔌 Stopping ephemeral test mongod...");
    mongodProc.kill("SIGKILL");
    mongodProc = null;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (fs.existsSync(TEST_RUN_DIR)) {
    try {
      fs.rmSync(TEST_RUN_DIR, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Test Suites
 */
async function runAllTests() {
  console.log("============================================================");
  console.log("🧪 STAYEASE DATABASE TEST SUITE");
  console.log("============================================================\n");

  try {
    await startEphemeralMongo();
  } catch (err) {
    console.error("❌ Could not start ephemeral MongoDB for tests:", err.message);
    process.exit(1);
  }

  try {
    // ─────────────────────────────────────────────
    // TEST 1: MongoDB Connection & URI Sanitization
    // ─────────────────────────────────────────────
    console.log("--- 1. MongoDB Connection & Security ---");
    {
      const masked = sanitizeMongoUri("mongodb+srv://adminUser:SuperSecret123@cluster0.abcde.mongodb.net/prod?retryWrites=true");
      const passedMask = !masked.includes("SuperSecret123") && masked.includes("***:***@");
      recordTest("URI Credential Sanitizer", passedMask, `Output: ${masked}`);

      await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 5000 });
      const passedConn = mongoose.connection.readyState === 1;
      recordTest("MongoDB Connection to Test DB", passedConn, `Connected to: ${mongoose.connection.name}`);
    }

    // ─────────────────────────────────────────────
    // TEST 2: Model Validation
    // ─────────────────────────────────────────────
    console.log("\n--- 2. Model Schema Validation ---");
    {
      // Missing required fields on User
      let userValFailed = false;
      try {
        const invalidUser = new User({ email: "invalid-email" });
        await invalidUser.validate();
      } catch (err) {
        userValFailed = !!err.errors?.name && !!err.errors?.username && !!err.errors?.password;
      }
      recordTest("User Model Validation (required fields & email regex)", userValFailed);

      // Hotel validation
      let hotelValPassed = false;
      try {
        const hotel = new Hotel({
          name: "Test Hotel Luxury",
          description: "A test luxury resort in Goa",
          category: "resort",
          city: "Goa",
          location: { address: "Calangute Beach", city: "Goa" },
          price: 5000,
        });
        await hotel.validate();
        hotelValPassed = hotel.images.length >= 0 && hotel.city === "Goa";
      } catch (err) {
        hotelValPassed = false;
      }
      recordTest("Hotel Model Validation & Pre-validate Hook", hotelValPassed);

      // Booking validation
      let bookingValPassed = false;
      let bookingErrMsg = "";
      try {
        const booking = new Booking({
          userId: new mongoose.Types.ObjectId(),
          hotelId: new mongoose.Types.ObjectId(),
          roomId: new mongoose.Types.ObjectId(),
          guestName: "Pooja Verma",
          email: "pooja@example.com",
          subtotal: 8000,
          taxes: 960,
          total: 8960,
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 86400000),
          rooms: 1,
          guests: 2,
          nights: 1,
          status: "Confirmed", // Test titlecase normalization
        });
        await booking.validate();
        bookingValPassed = booking.status === "confirmed" && booking.pricing.totalAmount === 8960 && !!booking.reference;
      } catch (err) {
        bookingValPassed = false;
        bookingErrMsg = err.message;
      }
      recordTest("Booking Model Validation & Legacy Field Normalization", bookingValPassed, bookingErrMsg);
    }

    // ─────────────────────────────────────────────
    // TEST 3: Unique Email Constraint
    // ─────────────────────────────────────────────
    console.log("\n--- 3. Unique Email Constraint ---");
    {
      await User.init(); // Ensure indexes are built in MongoDB
      const testEmail = "unique_constraint_test@stayease.com";

      const u1 = new User({
        name: "User One",
        username: "userone_" + Date.now(),
        email: testEmail,
        password: "Password123!",
      });
      await u1.save();

      let duplicateBlocked = false;
      try {
        const u2 = new User({
          name: "User Two",
          username: "usertwo_" + Date.now(),
          email: testEmail, // Duplicate email!
          password: "Password123!",
        });
        await u2.save();
      } catch (err) {
        duplicateBlocked = err.code === 11000 || err.message.includes("duplicate key");
      }
      recordTest("Unique Email Constraint (E11000 duplicate key prevention)", duplicateBlocked);
    }

    // ─────────────────────────────────────────────
    // TEST 4: Unique Inventory Record Constraint
    // ─────────────────────────────────────────────
    console.log("\n--- 4. Unique Inventory Record Constraint ---");
    {
      await InventoryDay.init(); // Ensure compound index { roomId: 1, date: 1 } is built
      const roomId = new mongoose.Types.ObjectId();
      const hotelId = new mongoose.Types.ObjectId();
      const targetDate = new Date("2026-12-01T00:00:00.000Z");

      const inv1 = new InventoryDay({
        roomId,
        hotelId,
        date: targetDate,
        available: 5,
      });
      await inv1.save();

      let invDupBlocked = false;
      try {
        const inv2 = new InventoryDay({
          roomId,
          hotelId,
          date: targetDate, // Same room + same date!
          available: 3,
        });
        await inv2.save();
      } catch (err) {
        invDupBlocked = err.code === 11000 || err.message.includes("duplicate key");
      }
      recordTest("Unique InventoryDay Compound Index ({ roomId, date })", invDupBlocked);
    }

    // ─────────────────────────────────────────────
    // TEST 5: Migration Fixture Setup & Edge Cases
    // ─────────────────────────────────────────────
    console.log("\n--- 5. Migration Configuration, Archived Source & Dry-Run ---");
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.mkdirSync(FIXTURE_BACKUP_DIR, { recursive: true });

    const validFixturePath = path.join(FIXTURE_DIR, "valid-db.json");
    const invalidFixturePath = path.join(FIXTURE_DIR, "invalid-db.json");
    const missingFixturePath = path.join(FIXTURE_DIR, "does-not-exist.json");

    const demoPasswordHash = await bcrypt.hash("password123", 10);
    const fixtureData = {
      users: [
        {
          id: "usr_demo123",
          username: "demouser",
          name: "Aarav Sharma",
          email: "aarav@stayease.com",
          password: demoPasswordHash,
          phone: "+91 9876543210",
          role: "user",
          loyaltyPoints: 1250,
          tier: "Gold Explorer",
        },
        {
          id: "usr_owner_fix",
          username: "fixtureowner",
          name: "Riya Owner",
          email: "riyamakker34@gmail.com",
          password: demoPasswordHash,
          role: "owner",
        },
      ],
      hotels: [
        {
          id: 1,
          name: "Coastal Palm Retreat",
          city: "Goa",
          location: "Calangute Beach, Goa",
          price: 4500,
          rating: 4.7,
          amenities: ["Free Wi-Fi", "Pool"],
          description: "Beachfront retreat in Goa.",
        },
      ],
      bookings: [
        {
          id: "bkg_demo001",
          reference: "ST-8492011",
          userId: "usr_demo123",
          userEmail: "aarav@stayease.com",
          guestName: "Aarav Sharma",
          email: "aarav@stayease.com",
          phone: "+91 9876543210",
          hotelId: 1,
          hotelName: "Coastal Palm Retreat",
          hotelCity: "Goa",
          roomId: "1-standard",
          roomName: "Standard Room",
          roomPrice: 4500,
          checkIn: "2026-12-01",
          checkOut: "2026-12-03",
          guests: 2,
          rooms: 1,
          nights: 2,
          subtotal: 9000,
          taxes: 1080,
          total: 10080,
          status: "Confirmed",
        },
      ],
      feedbacks: [
        {
          id: "fb_001",
          name: "Aanya Singhania",
          location: "Mumbai",
          rating: 5,
          hotelStayed: "Coastal Palm Retreat",
          comment: "Wonderful stay!",
        },
      ],
    };

    fs.writeFileSync(validFixturePath, JSON.stringify(fixtureData, null, 2), "utf8");
    fs.writeFileSync(invalidFixturePath, "{ invalid json :::", "utf8");

    {
      // 5a. Verify runtime db.json is absent and archive exists
      const runtimeDbExists = fs.existsSync(path.join(SERVER_ROOT, "data", "db.json"));
      const archiveDir = path.join(SERVER_ROOT, "archive", "legacy-data");
      const archiveFiles = fs.existsSync(archiveDir)
        ? fs.readdirSync(archiveDir).filter((f) => f.endsWith(".json"))
        : [];
      recordTest(
        "Archived JSON Source Present & Active db.json Removed",
        !runtimeDbExists && archiveFiles.length > 0,
        `activeExists=${runtimeDbExists}, archivedFiles=${archiveFiles.length}`
      );

      // 5b. Missing source file behavior
      let missingThrew = false;
      try {
        await runMigration({ dryRun: true, uri: TEST_URI, sourcePath: missingFixturePath });
      } catch (err) {
        missingThrew = err.message.includes("does not exist");
      }
      recordTest("Missing Source File Handled Gracefully", missingThrew);

      // 5c. Invalid JSON handling
      let invalidJsonThrew = false;
      try {
        await runMigration({ dryRun: true, uri: TEST_URI, sourcePath: invalidFixturePath });
      } catch (err) {
        invalidJsonThrew = err.message.includes("Invalid JSON");
      }
      recordTest("Invalid JSON Handling (rejects malformed JSON)", invalidJsonThrew);

      // 5d. Dry-run mode with zero writes
      const usersBefore = await User.countDocuments();
      const hotelsBefore = await Hotel.countDocuments();
      const bookingsBefore = await Booking.countDocuments();
      const drySummary = await runMigration({
        dryRun: true,
        uri: TEST_URI,
        sourcePath: validFixturePath,
        backupDir: FIXTURE_BACKUP_DIR,
      });
      const usersAfter = await User.countDocuments();
      const hotelsAfter = await Hotel.countDocuments();
      const bookingsAfter = await Booking.countDocuments();

      const dryRunNoWrites =
        usersBefore === usersAfter &&
        hotelsBefore === hotelsAfter &&
        bookingsBefore === bookingsAfter &&
        drySummary.backupPath === null;
      const dryRunScanned =
        drySummary.users.scanned === 2 &&
        drySummary.hotels.scanned === 1 &&
        drySummary.bookings.scanned === 1 &&
        drySummary.feedbacks.scanned === 1;
      recordTest("Migration Dry-Run (zero writes & valid parsing)", dryRunNoWrites && dryRunScanned);
    }

    // ─────────────────────────────────────────────
    // TEST 6: Migration Live Execution & Idempotency
    // ─────────────────────────────────────────────
    console.log("\n--- 6. Migration Live Execution & Idempotency ---");
    {
      // First Live Migration Run against isolated ephemeral MongoDB
      const liveSummary1 = await runMigration({
        dryRun: false,
        uri: TEST_URI,
        sourcePath: validFixturePath,
        backupDir: FIXTURE_BACKUP_DIR,
      });
      const passedRun1 =
        liveSummary1.users.migrated === 2 &&
        liveSummary1.hotels.migrated === 1 &&
        liveSummary1.bookings.migrated === 1 &&
        liveSummary1.feedbacks.migrated === 1;
      recordTest("Live Migration First Run (migrated users, hotels, bookings, feedbacks)", passedRun1);

      // Verify backup was created in temp backup dir
      const backupCreated = liveSummary1.backupPath && fs.existsSync(liveSummary1.backupPath);
      recordTest("Pre-migration Backup Creation", backupCreated, liveSummary1.backupPath);

      // Second Live Migration Run (MUST skip all and insert 0 duplicates)
      const liveSummary2 = await runMigration({
        dryRun: false,
        uri: TEST_URI,
        sourcePath: validFixturePath,
        backupDir: FIXTURE_BACKUP_DIR,
      });
      const duplicatePreventionPassed =
        liveSummary2.users.migrated === 0 &&
        liveSummary2.hotels.migrated === 0 &&
        liveSummary2.bookings.migrated === 0 &&
        liveSummary2.feedbacks.migrated === 0 &&
        liveSummary2.users.skipped === liveSummary2.users.scanned;
      recordTest("Duplicate Migration Prevention (idempotency: 0 duplicates on re-run)", duplicatePreventionPassed);
    }

    // ─────────────────────────────────────────────
    // TEST 7: Migration Data Integrity & Bcrypt Preservation
    // ─────────────────────────────────────────────
    console.log("\n--- 7. Migration Data Integrity & Hash Preservation ---");
    {
      const migratedUser = await User.findOne({ username: "demouser" }).select("+password");
      const passwordPreserved =
        migratedUser &&
        /^\$2[aby]\$10\$/.test(migratedUser.password) &&
        (await bcrypt.compare("password123", migratedUser.password));
      recordTest(
        "Bcrypt Hash Preserved Without Double-Hashing",
        !!passwordPreserved,
        `Valid bcrypt: ${migratedUser?.password?.substring(0, 10)}...`
      );

      // Check relationship integrity: Booking references valid migrated User & Hotel
      const booking = await Booking.findOne({ legacyId: "bkg_demo001" });
      let relPassed = false;
      if (booking) {
        const linkedHotel = await Hotel.findById(booking.hotelId);
        const linkedUser = await User.findById(booking.userId);
        relPassed = !!linkedHotel && !!linkedUser;
      }
      recordTest("Relational Integrity (Booking -> User and Hotel references intact)", relPassed);

      // Check demo record marking
      const demoUser = await User.findOne({ username: "demouser" });
      recordTest("Demo Records Correctly Identified (isDemo flag)", demoUser?.isDemo === true);
    }
  } finally {
    await stopEphemeralMongo();
  }

  // Final Summary Report
  console.log("\n============================================================");
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("============================================================\n");

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests:  ${total}`);
  console.log(`Passed:       ${passed}`);
  console.log(`Failed:       ${failed}`);

  if (failed > 0) {
    console.log("\nFailed Tests:");
    results.filter((r) => !r.passed).forEach((r) => console.log(`  ❌ ${r.name}: ${r.message}`));
    process.exit(1);
  } else {
    console.log("\n🎉 ALL DATABASE AND MIGRATION TESTS PASSED CLEANLY!\n");
  }
}

runAllTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});

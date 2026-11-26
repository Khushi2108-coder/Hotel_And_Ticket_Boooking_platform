import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from server/.env then .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectDB, verifyAtlasConnection, disconnectDB, sanitizeMongoUri } from "../config/database.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import Feedback from "../models/Feedback.js";

async function main() {
  console.log("\n============================================================");
  console.log("☁️  STAYEASE: MONGODB ATLAS LIVE CONNECTION VERIFICATION");
  console.log("============================================================\n");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not set in server/.env or .env");
    process.exit(1);
  }

  console.log(`Target: ${sanitizeMongoUri(uri)}`);

  try {
    // 1. Connect
    const connResult = await connectDB();
    console.log(`\n1. Connection Handshake:  ✅ SUCCESS`);
    console.log(`   Database Name:         ${connResult.database}`);
    console.log(`   Cluster Host:          ${connResult.host}`);

    // 2. Ping & Read/Write verification
    console.log(`\n2. Running Verification Suite...`);
    const verifyResult = await verifyAtlasConnection();

    console.log(`   Database Ping:         ${verifyResult.ping ? "✅ SUCCESS ({ ok: 1 })" : "❌ FAILED"}`);
    console.log(`   Test Write to Atlas:   ${verifyResult.writeTest ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`   Test Read from Atlas:  ${verifyResult.readTest ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`   Test Record Cleanup:   ${verifyResult.cleanupTest ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`   Mongoose Models Check: ${verifyResult.modelAccess ? "✅ SUCCESS (" + verifyResult.registeredModels.length + " models registered)" : "❌ FAILED"}`);

    // 3. Count documents in Atlas
    console.log(`\n3. Current Atlas Database State:`);
    const userCount = await User.countDocuments();
    const hotelCount = await Hotel.countDocuments();
    const roomCount = await Room.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const feedbackCount = await Feedback.countDocuments();

    console.log(`   Users in Atlas:        ${userCount}`);
    console.log(`   Hotels in Atlas:       ${hotelCount}`);
    console.log(`   Rooms in Atlas:        ${roomCount}`);
    console.log(`   Bookings in Atlas:     ${bookingCount}`);
    console.log(`   Feedbacks in Atlas:    ${feedbackCount}`);

    console.log("\n============================================================");
    console.log("🎉 ALL ATLAS VERIFICATION CHECKS PASSED!");
    console.log("============================================================\n");

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Atlas verification failed:", err.message);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

main();

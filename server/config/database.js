import mongoose from "mongoose";
import { config } from "./config.js";

/**
 * Mask credentials in MongoDB connection string for safe logging.
 * Replaces username:password with ***:***.
 */
export function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== "string") return "[URI_NOT_SET]";
  try {
    return uri.replace(
      /(mongodb(?:\+srv)?:\/\/)(?:([^:]+):([^@]+)@)?/i,
      (match, protocol, user, pass) => {
        if (user || pass) {
          return `${protocol}***:***@`;
        }
        return match;
      }
    );
  } catch {
    return "[MASKED_URI]";
  }
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDBStatus() {
  const readyStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const state = readyStates[mongoose.connection.readyState] || "unknown";

  return {
    connected: isDBConnected(),
    readyState: mongoose.connection.readyState,
    status: state,
    database: isDBConnected() ? mongoose.connection.name : null,
    host: isDBConnected() ? mongoose.connection.host : null,
    cluster: isDBConnected() && mongoose.connection.host ? mongoose.connection.host.split(".")[0] : null,
  };
}


export async function connectDB(options = {}) {
  const uri = options.uri !== undefined ? options.uri : config.MONGODB_URI;
  const timeoutMs = options.timeoutMs || 10000;

  if (isDBConnected()) {
    return { connected: true, host: mongoose.connection.host, database: mongoose.connection.name };
  }

  // Validate MONGODB_URI exists
  if (!uri || typeof uri !== "string" || uri.trim() === "") {
    const errorMsg = "❌ MONGODB_URI is not set in server/.env. A valid MongoDB Atlas connection string is required.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate Atlas URI format
  if (!uri.startsWith("mongodb+srv://") && !uri.startsWith("mongodb://")) {
    const errorMsg = "❌ Invalid MONGODB_URI format. Must start with 'mongodb+srv://' for MongoDB Atlas.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const maskedUri = sanitizeMongoUri(uri);

  try {
    console.log(`🔌 Connecting to MongoDB Atlas: ${maskedUri}...`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log(`✅ MongoDB Atlas connected successfully to database: "${mongoose.connection.name}"`);
    console.log(`📡 Cluster Host: ${mongoose.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB Atlas runtime error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB Atlas disconnected.");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB Atlas reconnected successfully.");
    });

    return {
      connected: true,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    };
  } catch (error) {
    console.error(`\n❌ Failed to connect to MongoDB Atlas (${maskedUri}):`);
    if (error.code === 8000 || error.codeName === "AtlasError") {
      console.error("   Reason: Authentication failed (bad username/password). Check credentials in server/.env.");
    } else if (error.message.includes("ETIMEOUT") || error.message.includes("getaddrinfo")) {
      console.error("   Reason: Network/DNS timeout. Check Atlas Network Access IP allowlist (allow 0.0.0.0/0).");
    } else {
      console.error(`   Reason: ${error.message}`);
    }
    console.error("   Server will not start without a working MongoDB Atlas connection.\n");
    throw error;
  }
}

/**
 * Execute full verification test suite against the live Atlas cluster:
 * 1. Database ping
 * 2. Database name check
 * 3. Dedicated collection write, read, and delete (_connection_tests)
 * 4. Model access check
 */
export async function verifyAtlasConnection() {
  if (!isDBConnected()) {
    throw new Error("Cannot run verification: MongoDB Atlas is not connected.");
  }

  const testResults = {
    connected: true,
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    ping: false,
    writeTest: false,
    readTest: false,
    cleanupTest: false,
    modelAccess: false,
  };

  // 1. Ping
  const pingRes = await mongoose.connection.db.admin().ping();
  testResults.ping = pingRes.ok === 1;

  // 2. Write test on dedicated _connection_tests collection
  const testColl = mongoose.connection.db.collection("_connection_tests");
  const testId = new mongoose.Types.ObjectId();
  const testDoc = {
    _id: testId,
    purpose: "StayEase Atlas Connection Verification",
    timestamp: new Date(),
  };

  await testColl.insertOne(testDoc);
  testResults.writeTest = true;

  // 3. Read test
  const readBack = await testColl.findOne({ _id: testId });
  testResults.readTest = readBack && readBack.purpose === testDoc.purpose;

  // 4. Cleanup
  const deleteRes = await testColl.deleteOne({ _id: testId });
  testResults.cleanupTest = deleteRes.deletedCount === 1;

  // 5. Model access check (models registered)
  const models = Object.keys(mongoose.models);
  testResults.modelAccess = models.length > 0;
  testResults.registeredModels = models;

  return testResults;
}

/**
 * Gracefully close MongoDB Atlas connection
 */
export async function disconnectDB(timeoutMs = 5000) {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    const closePromise = mongoose.connection.close(false);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MongoDB disconnect timed out")), timeoutMs)
    );
    await Promise.race([closePromise, timeoutPromise]);
    console.log("🔌 MongoDB Atlas connection closed gracefully.");
  } catch (err) {
    console.warn("⚠️  Error closing MongoDB connection:", err.message);
  }
}

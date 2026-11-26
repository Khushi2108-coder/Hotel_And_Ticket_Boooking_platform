import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/config.js";
import { connectDB, disconnectDB, getDBStatus, isDBConnected, verifyAtlasConnection } from "./config/database.js";
import { requestLogger } from "./middleware/loggerMiddleware.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import holdRoutes from "./routes/holdRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

const app = express();

// ─────────────────────────────────────────────
// 1. Security Headers (Helmet)
// ─────────────────────────────────────────────
app.use(helmet());

// ─────────────────────────────────────────────
// 2. CORS – allow any localhost dev server
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// 3. Rate Limiting
// ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // relaxed for development testing
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
});

app.use(globalLimiter);

// ─────────────────────────────────────────────
// 4. Raw body for Razorpay webhooks (MUST be before express.json)
// ─────────────────────────────────────────────
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// ─────────────────────────────────────────────
// 5. Body Parsers
// ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────
// 6. Request Logger
// ─────────────────────────────────────────────
app.use(requestLogger);

// ─────────────────────────────────────────────
// 7. Health Check Routes
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    name: "StayEase Hotel Booking Backend API",
    status: "online",
    version: "2.0.0",
    db: getDBStatus(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    db: getDBStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/db-verify", async (req, res) => {
  try {
    const results = await verifyAtlasConnection();
    res.json({ success: true, verification: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// 8. API Routes
// ─────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/holds", holdRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/feedback", feedbackRoutes);

// ─────────────────────────────────────────────
// 9. Error Handling
// ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─────────────────────────────────────────────
// 10. MongoDB Connection + Server Start
// ─────────────────────────────────────────────
let serverInstance = null;

async function startServer() {
  try {
    // Connect to MongoDB Atlas (fatal if connection fails; no silent fallback)
    const dbResult = await connectDB();

    // Start background workers ONLY after a successful Atlas connection
    try {
      const { startHoldExpiryWorker } = await import("./services/holdExpiryWorker.js");
      startHoldExpiryWorker();
      console.log("⏱️  Booking hold expiry worker started.");
    } catch (workerErr) {
      console.warn("⚠️  Failed to start hold expiry worker:", workerErr.message);
    }

    const PORT = config.PORT;
    serverInstance = app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 StayEase v2.0 running on port ${PORT}`);
      console.log(`📡 URL:      http://localhost:${PORT}`);
      console.log(`💾 Database: MONGODB ATLAS (${dbResult.database})`);
      console.log(`☁️  Host:     ${dbResult.host}`);
      console.log(`🔐 Auth:     http://localhost:${PORT}/api/auth`);
      console.log(`🏨 Hotels:   http://localhost:${PORT}/api/hotels`);
      console.log(`📋 Bookings: http://localhost:${PORT}/api/bookings`);
      console.log(`👤 Users:    http://localhost:${PORT}/api/users`);
      console.log(`=================================================\n`);
    });

    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`   Run this command to free it: npx kill-port ${PORT}`);
        console.error(`   Or change PORT in server/.env`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error("❌ Fatal error during server startup:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function handleShutdown(signal) {
  console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);

  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    console.log("🔌 HTTP server stopped.");
  }

  await disconnectDB();
  console.log("👋 StayEase server shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();

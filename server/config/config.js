import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env, then root .env (so setting either one works!)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Guard: abort startup if critical secrets are missing in production
if (process.env.NODE_ENV === "production") {
  const required = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }
}

export const config = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT – NO hardcoded fallback in production
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev_jwt_secret_do_not_use_in_prod" : undefined),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV !== "production" ? "dev_refresh_secret_do_not_use_in_prod" : undefined),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || "StayEase <noreply@stayease.com>",

  // Client / Frontend URL (used in emails & password reset links)
  FRONTEND_URL: (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, ""),
  CLIENT_URL: (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, ""),

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
};

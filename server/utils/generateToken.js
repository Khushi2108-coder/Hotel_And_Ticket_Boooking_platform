import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/config.js";

/**
 * Generate a short-lived access token (15 min)
 * Payload contains only non-sensitive identification fields: { id, email, role }
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || "15m",
  });
}

/**
 * Generate a long-lived refresh token (7 days)
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

/**
 * Verify a refresh token with the dedicated refresh secret
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

/**
 * Hash a token using SHA-256 for secure database storage
 */
export function hashToken(token) {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
}

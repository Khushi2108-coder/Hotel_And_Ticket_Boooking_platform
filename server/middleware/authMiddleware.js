import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { userRepository } from "../repositories/userRepository.js";
import { hotelRepository } from "../repositories/hotelRepository.js";

/**
 * protect – Require a valid JWT Access Token.
 * Attaches req.user (without password or sensitive tokens).
 */
export async function protect(req, res, next) {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token is missing.",
      });
    }

    // Verify token with JWT access secret
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    // Fetch user from repository (MongoDB Atlas)
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const {
      password: _,
      refreshToken: __,
      resetPasswordToken: ___,
      resetPasswordExpires: ____,
      ...safeUser
    } = user;

    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}

/**
 * optionalAuth – If a valid token is present, attach req.user; otherwise continue as guest.
 */
export async function optionalAuth(req, res, next) {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      if (user && user.isActive !== false) {
        const {
          password: _,
          refreshToken: __,
          resetPasswordToken: ___,
          ...safeUser
        } = user;
        req.user = safeUser;
      }
    }
  } catch {
    // Continue as guest
  }
  next();
}

/**
 * authorizeRoles / requireRole – Restrict route to specific role(s).
 * Must be used AFTER protect middleware.
 */
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: ${roles.join(", ")}.`,
      });
    }

    next();
  };
}

export const requireRole = authorizeRoles;

/**
 * checkPropertyOwnership – Validate that the authenticated owner owns the target hotel property.
 * Administrators bypass ownership validation.
 */
export function checkPropertyOwnership(paramName = "id") {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      // Admins have overarching authority over all properties
      if (req.user.role === "admin") {
        return next();
      }

      const hotelId =
        req.params[paramName] ||
        req.body.hotelId ||
        req.query.hotelId;

      if (!hotelId) {
        return res.status(400).json({
          success: false,
          message: "Hotel identifier is required for property authorization.",
        });
      }

      const hotel = await hotelRepository.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel property not found.",
        });
      }

      const hotelOwnerId = (hotel.ownerId?._id || hotel.ownerId || "").toString();
      const currentUserId = (req.user.id || req.user._id || "").toString();

      if (!hotelOwnerId || hotelOwnerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: You do not own or have management permissions for this property.",
        });
      }

      req.hotel = hotel;
      next();
    } catch (error) {
      next(error);
    }
  };
}

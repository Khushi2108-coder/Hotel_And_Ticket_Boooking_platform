import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { userRepository } from "../repositories/userRepository.js";
import User from "../models/User.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../utils/generateToken.js";
import { config } from "../config/config.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

// Helper to extract cookie from request without requiring cookie-parser
function getCookie(req, name) {
  if (req.cookies && req.cookies[name]) return req.cookies[name];
  if (!req.headers.cookie) return null;
  const match = req.headers.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to set secure refresh token cookie
function setRefreshTokenCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

// Helper to clear refresh token cookie
function clearRefreshTokenCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { username, name, email, password, confirmPassword, phone } = req.body;

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    let cleanUsername = (username || name?.replace(/\s+/g, "").toLowerCase() || "user").trim().toLowerCase();
    const displayName = (name || username || cleanUsername).trim();

    // Check for existing email
    const existingEmail = await userRepository.findByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    // Check username uniqueness
    if (username) {
      const existingUsername = await userRepository.findByUsername(cleanUsername);
      if (existingUsername) {
        return res.status(409).json({ success: false, message: "This username is already taken." });
      }
    } else {
      let candidate = cleanUsername;
      let counter = 1;
      while (await userRepository.findByUsername(candidate)) {
        candidate = `${cleanUsername}${counter++}`;
      }
      cleanUsername = candidate;
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // SECURITY: Strictly enforce role = "user". Prevent users from self-registering as "admin" or "owner".
    const newUser = await userRepository.create({
      username: cleanUsername,
      name: displayName || cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      dateOfBirth: null,
      city: "",
      avatar: "",
      role: "user", // ALWAYS user for public registration
      tier: "Silver Explorer",
      loyaltyPoints: 100,
      isActive: true,
    });

    // Generate tokens
    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    const refreshToken = generateRefreshToken({ id: newUser.id });

    // Store hashed refresh token in database
    await userRepository.updateById(newUser.id, {
      refreshToken: hashToken(refreshToken),
    });

    // Set HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    const { password: _, refreshToken: __, resetPasswordToken: ___, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to StayEase.",
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login with email/username and password
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const identifier = (email || username || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Email/username and password are required." });
    }

    // Find user by email or username (including password)
    let user = await userRepository.findByEmail(identifier, { includePassword: true });
    if (!user) {
      user = await userRepository.findByUsername(identifier, { includePassword: true });
    }
    if (!user) {
      user = await userRepository.findOne(
        (u) =>
          u.email?.toLowerCase() === identifier ||
          u.username?.toLowerCase() === identifier,
        { includePassword: true }
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email/username or password." });
    }

    // Account status check
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Password verification with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email/username or password." });
    }

    // Generate token pair
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store hashed refresh token
    await userRepository.updateById(user.id, {
      refreshToken: hashToken(refreshToken),
    });

    // Set HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    const { password: _, refreshToken: __, resetPasswordToken: ___, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token and rotate refresh token
 * POST /api/auth/refresh
 */
export async function refreshToken(req, res, next) {
  try {
    const incomingToken =
      getCookie(req, "refreshToken") ||
      req.body.refreshToken ||
      req.headers["x-refresh-token"];

    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing. Please log in again.",
      });
    }

    // Verify token cryptographic signature & expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(incomingToken);
    } catch (err) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token. Please log in again.",
      });
    }

    let user;
    user = await User.findById(decoded.id).select("+refreshToken");

    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ success: false, message: "User account no longer exists." });
    }

    if (user.isActive === false) {
      clearRefreshTokenCookie(res);
      return res.status(403).json({ success: false, message: "Account has been deactivated." });
    }

    // Token reuse protection: compare hash of incoming token with stored hash
    const incomingHash = hashToken(incomingToken);
    if (!user.refreshToken || user.refreshToken !== incomingHash) {
      // Possible token reuse attack! Invalidate all sessions for security
      await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
      clearRefreshTokenCookie(res);
      return res.status(403).json({
        success: false,
        message: "Refresh token reuse detected or session expired. Please log in again.",
      });
    }

    // Rotate refresh token: generate brand-new access token AND brand-new refresh token
    const userId = user._id ? user._id.toString() : user.id;
    const newAccessToken = generateToken({ id: userId, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: userId });

    // Store new hashed refresh token
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    // Set new HTTP-only cookie
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      token: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout and invalidate refresh token
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const incomingToken =
      getCookie(req, "refreshToken") ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    let userId = req.user?.id || req.user?._id;

    if (!userId && incomingToken) {
      try {
        const decoded = verifyRefreshToken(incomingToken);
        userId = decoded.id;
      } catch {
        // Token was invalid, proceed with clearing cookie
      }
    }

    // Invalidate refresh token in database
    if (userId) {
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }

    // Clear HTTP-only cookie
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request password reset email
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Please provide your email address." });
    }

    let user = await User.findOne({ email: cleanEmail });

    // To prevent email enumeration attacks, always respond with a success message
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, password reset instructions have been sent.",
      });
    }

    // Generate cryptographically secure random reset token (32 bytes)
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Save hashed token & expiry in user document
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Construct password reset link from configured frontend URL
    const frontendBaseUrl = (config.FRONTEND_URL || config.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
    const resetUrl = `${frontendBaseUrl}/reset-password/${rawResetToken}`;

    // Attempt to send email via configured nodemailer service
    let emailSent = false;
    try {
      if (config.EMAIL_USER && config.EMAIL_PASS) {
        await sendPasswordResetEmail(user.email, resetUrl, user.name);
        emailSent = true;
      }
    } catch (mailErr) {
      console.warn("⚠️  Email delivery failed (SMTP may not be configured):", mailErr.message);
    }

    const response = {
      success: true,
      message: "If an account with that email exists, password reset instructions have been sent.",
      emailSent,
    };

    // In development mode, provide reset token for automated testing & UI verification
    if (process.env.NODE_ENV !== "production") {
      response.devToken = rawResetToken;
      response.devResetUrl = resetUrl;
    }

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password using reset token
 * POST /api/auth/reset-password/:token
 */
export async function resetPassword(req, res, next) {
  try {
    const rawToken = req.params.token || req.body.token;
    const { password, confirmPassword } = req.body;

    if (!rawToken) {
      return res.status(400).json({ success: false, message: "Password reset token is required." });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    // Hash the raw token with SHA-256 to look up matching record
    const hashedToken = hashToken(rawToken);

    let user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    // Update password (User.pre('save') handles hashing, or we hash explicitly)
    const newHashedPassword = await bcrypt.hash(password, 12);

    user.password = newHashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // Invalidate all existing sessions
    await user.save();

    // Clear any active cookie
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: "Password has been successfully reset. Please log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Google OAuth login / signup
 * POST /api/auth/google
 */
export async function googleLogin(req, res, next) {
  try {
    const { idToken, credential, userInfo } = req.body;
    const token = idToken || credential;

    let googleEmail = null;
    let googleName = null;
    let googleSub = null;
    let googlePicture = "";

    if (token) {
      if (config.GOOGLE_CLIENT_ID) {
        try {
          const { OAuth2Client } = await import("google-auth-library");
          const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
          const ticket = await client.verifyIdToken({ idToken: token, audience: config.GOOGLE_CLIENT_ID });
          const payload = ticket.getPayload();
          googleEmail = payload.email?.toLowerCase();
          googleName = payload.name;
          googleSub = payload.sub;
          googlePicture = payload.picture || "";
        } catch (err) {
          console.warn("verifyIdToken with audience failed, falling back to payload decode:", err.message);
          const decoded = jwt.decode(token);
          if (decoded && decoded.email) {
            googleEmail = decoded.email.toLowerCase();
            googleName = decoded.name;
            googleSub = decoded.sub;
            googlePicture = decoded.picture || "";
          }
        }
      } else {
        const decoded = jwt.decode(token);
        if (decoded && decoded.email) {
          googleEmail = decoded.email.toLowerCase();
          googleName = decoded.name;
          googleSub = decoded.sub;
          googlePicture = decoded.picture || "";
        }
      }
    } else if (userInfo && userInfo.email) {
      googleEmail = userInfo.email.toLowerCase();
      googleName = userInfo.name || userInfo.email.split("@")[0];
      googleSub = userInfo.sub || userInfo.id;
      googlePicture = userInfo.picture || "";
    }

    if (!googleEmail) {
      return res.status(400).json({ success: false, message: "Valid Google account email is required." });
    }

    // Find or create user
    let user = await userRepository.findByEmail(googleEmail);
    if (!user) {
      const rawUsername = (googleName || googleEmail.split("@")[0]).replace(/\s+/g, "").toLowerCase();
      let username = rawUsername;
      let counter = 1;
      while (await userRepository.findByUsername(username)) {
        username = `${rawUsername}${counter++}`;
      }
      user = await userRepository.create({
        username,
        name: googleName || username,
        email: googleEmail,
        password: await bcrypt.hash(crypto.randomBytes(20).toString("hex"), 12),
        googleId: googleSub || "",
        avatar: googlePicture,
        phone: "",
        dateOfBirth: null,
        city: "",
        role: "user",
        tier: "Silver Explorer",
        loyaltyPoints: 100,
        isActive: true,
      });
    }

    const authToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshTokenVal = generateRefreshToken({ id: user.id });

    await userRepository.updateById(user.id, {
      refreshToken: hashToken(refreshTokenVal),
    });

    setRefreshTokenCookie(res, refreshTokenVal);

    const { password: _, refreshToken: __, resetPasswordToken: ___, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token: authToken,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const { password: _, refreshToken: __, resetPasswordToken: ___, ...safeUser } = user;
    return res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    next(error);
  }
}

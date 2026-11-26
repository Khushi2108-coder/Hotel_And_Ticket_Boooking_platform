import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middleware/validationMiddleware.js";

const router = Router();

/**
 * Authentication Routes
 */

// POST /api/auth/register
router.post("/register", validateRegister, register);

// POST /api/auth/login
router.post("/login", validateLogin, login);

// POST /api/auth/refresh
router.post("/refresh", refreshToken);

// POST /api/auth/logout
router.post("/logout", logout);

// POST /api/auth/forgot-password
router.post("/forgot-password", validateForgotPassword, forgotPassword);

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", validateResetPassword, resetPassword);

// POST /api/auth/google (Google OAuth)
router.post("/google", googleLogin);

// GET /api/auth/me (Protected route)
router.get("/me", protect, getMe);

export default router;

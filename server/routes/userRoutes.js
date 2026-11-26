import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateProfileUpdate } from "../middleware/validationMiddleware.js";

const router = Router();

/**
 * User Profile Routes
 * Demonstrates: Protected user actions, Update, Password change
 */

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validateProfileUpdate, updateUserProfile);
router.put("/change-password", protect, changePassword);

export default router;

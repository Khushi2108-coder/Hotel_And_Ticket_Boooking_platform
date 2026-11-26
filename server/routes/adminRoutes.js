import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { userRepository } from "../repositories/userRepository.js";
import { hotelRepository } from "../repositories/hotelRepository.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";

const router = Router();
router.use(protect);
router.use(authorizeRoles("admin"));


router.get("/dashboard", async (req, res, next) => {
  try {
    const totalUsers  = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Admin dashboard metrics loaded.",
      data: {
        totalUsers,
        totalHotels,
        systemStatus: "Healthy",
        connectedDatabase: "MongoDB Atlas",
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 * List all registered users (safe view)
 */
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
      .lean();

    const safeUsers = users.map((u) => {
      const { password, refreshToken, resetPasswordToken, ...safe } = u;
      return safe;
    });

    return res.status(200).json({
      success: true,
      count: safeUsers.length,
      users: safeUsers,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Admin-only role assignment
 */
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "owner", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified." });
    }

    const updated = await userRepository.updateById(req.params.id, { role });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate user account
 */
router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await userRepository.updateById(req.params.id, { isActive: !!isActive });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: `User account ${isActive ? "activated" : "deactivated"}.`,
      user: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/approvals
 * List hotel properties pending approval
 */
router.get("/approvals", async (req, res, next) => {
  try {
    const pendingHotels = await Hotel.find({ approvalStatus: "pending" }).lean();
    return res.status(200).json({
      success: true,
      count: pendingHotels.length,
      pendingHotels,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

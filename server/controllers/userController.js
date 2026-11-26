import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { bookingRepository } from "../repositories/bookingRepository.js";

/**
 * Get full user profile with account statistics
 * GET /api/users/profile
 */
export async function getUserProfile(req, res, next) {
  try {
    const userId = req.user.id || req.user._id?.toString();
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get user bookings count and stats
    const bookings = await bookingRepository.findByUserId(userId, user.email);

    const stats = {
      totalBookings: bookings.length,
      activeBookings: bookings.filter((b) => (b.status || "").toLowerCase() === "confirmed").length,
      cancelledBookings: bookings.filter((b) => (b.status || "").toLowerCase() === "cancelled").length,
      totalSpent: bookings.reduce((sum, b) => ((b.status || "").toLowerCase() === "confirmed" ? sum + (b.total || b.pricing?.totalAmount || 0) : sum), 0),
    };

    const { password: _, refreshToken: __, resetPasswordToken: ___, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      user: safeUser,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user personal profile
 * PUT /api/users/profile
 */
export async function updateUserProfile(req, res, next) {
  try {
    const userId = req.user.id || req.user._id?.toString();
    const { name, phone, dateOfBirth, city, email, avatar } = req.body;

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // If changing email, check if taken by another user
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await userRepository.findByEmail(email);
      if (emailTaken && (emailTaken.id || emailTaken._id?.toString()) !== userId) {
        return res.status(409).json({
          success: false,
          message: "This email address is already in use by another account.",
        });
      }
    }

    // Security: Only allow updating safe profile fields, never role, loyalty tier, or isActive
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (city !== undefined) updates.city = city.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await userRepository.updateById(userId, updates);
    const { password: _, refreshToken: __, resetPasswordToken: ___, ...safeUser } = updatedUser;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 * PUT /api/users/change-password
 */
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id || req.user._id?.toString();
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are both required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Must fetch with password
    const user = await userRepository.findById(userId, { includePassword: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match our records.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Invalidate existing sessions on password change
    await userRepository.updateById(userId, {
      password: hashedPassword,
      refreshToken: null,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}

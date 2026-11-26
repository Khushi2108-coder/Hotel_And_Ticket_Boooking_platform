import { Router } from "express";
import { protect, authorizeRoles, checkPropertyOwnership } from "../middleware/authMiddleware.js";
import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";

const router = Router();

// Protect ALL owner routes – require authentication and role "owner" or "admin"
router.use(protect);
router.use(authorizeRoles("owner", "admin"));

/**
 * GET /api/owner/dashboard
 * Summary stats for the authenticated owner
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const ownerId = (req.user._id || req.user.id)?.toString();
    const query   = req.user.role === "admin" ? {} : { ownerId };

    const properties = await Hotel.find(query).lean();

    // Count active bookings for owner's hotels
    const hotelIds = properties.map((p) => p._id);
    const activeBookings = hotelIds.length > 0
      ? await Booking.countDocuments({ hotelId: { $in: hotelIds }, status: { $in: ["confirmed", "pending"] } })
      : 0;

    return res.status(200).json({
      success: true,
      message: "Owner dashboard loaded.",
      data: {
        totalProperties: properties.length,
        properties,
        activeBookings,
        monthlyRevenue: 0, // Phase 5: implement real revenue aggregation
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/owner/properties
 * List properties owned by the authenticated owner
 */
router.get("/properties", async (req, res, next) => {
  try {
    const ownerId    = (req.user._id || req.user.id)?.toString();
    const query      = req.user.role === "admin" ? {} : { ownerId };
    const properties = await Hotel.find(query).lean();

    return res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/owner/properties/:id
 * Get single property with ownership verification
 */
router.get("/properties/:id", checkPropertyOwnership("id"), async (req, res) => {
  return res.status(200).json({ success: true, property: req.hotel });
});

/**
 * PUT /api/owner/properties/:id
 * Update property with ownership verification
 */
router.put("/properties/:id", checkPropertyOwnership("id"), async (req, res, next) => {
  try {
    const updated = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Property updated successfully.",
      property: updated || req.hotel,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/owner/bookings
 * Bookings for owner's properties
 */
router.get("/bookings", async (req, res, next) => {
  try {
    const ownerId  = (req.user._id || req.user.id)?.toString();
    const query    = req.user.role === "admin" ? {} : { ownerId };
    const hotels   = await Hotel.find(query).select("_id").lean();
    const hotelIds = hotels.map((h) => h._id);

    const bookings = hotelIds.length > 0
      ? await Booking.find({ hotelId: { $in: hotelIds } }).sort({ createdAt: -1 }).lean()
      : [];

    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
});

export default router;

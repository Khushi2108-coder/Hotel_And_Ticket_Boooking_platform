import { Router } from "express";
import {
  getMyBookings,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { validateBooking } from "../middleware/validationMiddleware.js";

const router = Router();

/**
 * Booking Routes (Full CRUD operations)
 * Demonstrates:
 * - GET /api/bookings/my (Read current user's bookings)
 * - GET /api/bookings (Read all bookings)
 * - GET /api/bookings/:id (Read booking by ID or reference)
 * - POST /api/bookings (Create booking with optional or required auth)
 * - PUT /api/bookings/:id (Update booking)
 * - DELETE /api/bookings/:id (Cancel/Delete booking)
 */

router.get("/my", protect, getMyBookings);
router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.post("/", optionalAuth, validateBooking, createBooking);
router.put("/:id", optionalAuth, updateBooking);
router.delete("/:id", optionalAuth, cancelBooking);

export default router;

import crypto from "crypto";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

/**
 * Generate a unique, readable booking reference. Format: SE-XXXXXXXX  (8 chars, deterministic per timestamp)
 */
function generateReference() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SE-${ts}${rnd}`.slice(0, 11); // SE-XXXXXXXX
}

/**
 * Get bookings for the authenticated user
 */
export async function getMyBookings(req, res, next) {
  try {
    const userId    = req.user?._id || req.user?.id;
    const userEmail = req.user?.email?.toLowerCase();
    const orConditions = [];
    if (userId)    orConditions.push({ userId: String(userId) });
    if (userId && /^[0-9a-fA-F]{24}$/.test(String(userId))) {
      orConditions.push({ userId });
    }
    if (userEmail) orConditions.push({ "guestDetails.email": userEmail });
    if (orConditions.length === 0) {
      return res.status(400).json({ success: false, message: "User identity not found." });
    }
    const bookings = await Booking.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all bookings (admin only)
 */
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single booking by MongoDB ObjectId, legacyId, or reference
 */
export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    let booking = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id).lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ legacyId: id }).lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ reference: id.toUpperCase() }).lean();
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking ${id} was not found.` });
    }

    // Authorization: user can only see their own booking (admin can see all)
    if (req.user && req.user.role !== "admin") {
      const userId = String(req.user._id || req.user.id || "");
      const bookingUserId = String(booking.userId || "");
      const userEmail = (req.user.email || "").toLowerCase();
      const bookingEmail = (booking.guestDetails?.email || "").toLowerCase();
      if (userId !== bookingUserId && userEmail !== bookingEmail) {
        return res.status(403).json({ success: false, message: "Unauthorized to view this booking." });
      }
    }
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new booking
 * POST /api/bookings
 */
export async function createBooking(req, res, next) {
  try {
    const {
      hotelId,
      hotelName,
      hotelCity,
      hotelImage,
      roomId,
      roomName,
      roomPrice,
      checkIn,
      checkOut,
      guests,
      rooms,
      guestName,
      email,
      phone,
      specialRequests,
    } = req.body;

    // Validate hotel exists
    let hotel = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(hotelId))) {
      hotel = await Hotel.findById(hotelId).lean();
    }
    if (!hotel && !isNaN(Number(hotelId))) {
      hotel = await Hotel.findOne({ legacyId: Number(hotelId) }).lean();
    }
    if (!hotel) {
      return res.status(404).json({ success: false, message: `Hotel ${hotelId} not found.` });
    }

    // Resolve room
    let room = null;
    if (roomId && /^[0-9a-fA-F]{24}$/.test(String(roomId))) {
      room = await Room.findById(roomId).lean();
    }
    if (!room) {
      room = await Room.findOne({ hotelId: hotel._id }).lean();
    }
    if (!room) {
      return res.status(404).json({ success: false, message: "No rooms available for this hotel." });
    }

    // Calculate nights
    const start  = new Date(`${checkIn}T00:00:00`);
    const end    = new Date(`${checkOut}T00:00:00`);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

    const pricePerNight = Number(roomPrice) || room.basePrice || 3500;
    const roomCount     = Number(rooms) || 1;
    const subtotal      = pricePerNight * nights * roomCount;
    const taxes         = Math.round(subtotal * 0.12);
    const total         = subtotal + taxes;

    const reference = generateReference();

    const booking = new Booking({
      reference,
      userId:   req.user ? (req.user._id || req.user.id) : null,
      hotelId:  hotel._id,
      roomId:   room._id,
      hotelName:  hotelName  || hotel.name  || "",
      hotelCity:  hotelCity  || hotel.city  || "",
      hotelImage: hotelImage || hotel.image || "",
      roomName:   roomName   || room.name   || "",
      roomPrice:  pricePerNight,
      checkIn:    new Date(checkIn),
      checkOut:   new Date(checkOut),
      guests:   Number(guests) || 2,
      rooms:    roomCount,
      nights,
      subtotal,
      taxes,
      total,
      guestDetails: {
        name:  (guestName || "Guest").trim(),
        email: (email || req.user?.email || "guest@stayease.com").toLowerCase().trim(),
        phone: (phone || "").trim(),
      },
      pricing: {
        baseAmount:        subtotal,
        taxes,
        totalAmount:       total,
        weekendSurcharge:  0,
        seasonalSurcharge: 0,
        couponDiscount:    0,
        pointsDiscount:    0,
      },
      specialRequests: specialRequests || "",
      status: "confirmed",
    });

    await booking.save();

    // Award loyalty points if logged in
    if (req.user?._id || req.user?.id) {
      const uid = req.user._id || req.user.id;
      const addedPoints = Math.round(total / 100);
      await User.findByIdAndUpdate(uid, { $inc: { loyaltyPoints: addedPoints } });
    }

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully!",
      booking: booking.toObject(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing booking
 * PUT /api/bookings/:id
 */
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;

    let filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { legacyId: id };

    const existing = await Booking.findOne(filter).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Ownership check
    if (req.user && req.user.role !== "admin") {
      const reqUserId = String(req.user._id || req.user.id || "");
      const bkUserId  = String(existing.userId || "");
      if (reqUserId !== bkUserId) {
        return res.status(403).json({ success: false, message: "Unauthorized to update this booking." });
      }
    }

    const updated = await Booking.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({ success: true, message: "Booking updated successfully.", booking: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel or delete a booking
 * DELETE /api/bookings/:id
 */
export async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    let filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { legacyId: id };

    const booking = await Booking.findOne(filter).lean();
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (req.query.permanent === "true") {
      await Booking.findOneAndDelete(filter);
      return res.status(200).json({ success: true, message: "Booking record deleted permanently." });
    }

    const cancelled = await Booking.findOneAndUpdate(
      filter,
      { $set: { status: "cancelled", cancelledAt: new Date() } },
      { new: true }
    ).lean();

    return res.status(200).json({ success: true, message: "Booking has been cancelled.", booking: cancelled });
  } catch (error) {
    next(error);
  }
}

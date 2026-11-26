import mongoose from "mongoose";

/**
 * BookingHold – temporary 15-minute inventory reservation before payment.
 *
 * IMPORTANT: Do NOT use MongoDB TTL auto-delete on this collection.
 * Inventory MUST be restored (via $inc on InventoryDay) before the hold is removed.
 * Use the holdExpiryWorker (node-cron) to handle expiry safely inside a transaction.
 */
const bookingHoldSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    rooms: { type: Number, required: true, min: 1 },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestEmail: { type: String },

    expiresAt: { type: Date, required: true }, // now() + 15 minutes
    status: {
      type: String,
      enum: ["active", "expired", "converted", "released"],
      default: "active",
    },

    // Set when payment order is created
    razorpayOrderId: { type: String, default: "" },

    // Set when booking is confirmed
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

    // Cached price at time of hold (server-calculated)
    pricingSnapshot: {
      baseAmount: Number,
      taxes: Number,
      totalAmount: Number,
      breakdown: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

bookingHoldSchema.index({ expiresAt: 1, status: 1 }); // expiry worker query
bookingHoldSchema.index({ roomId: 1, status: 1 });
bookingHoldSchema.index({ userId: 1 });
bookingHoldSchema.index({ razorpayOrderId: 1 }, { sparse: true });

const BookingHold = mongoose.model("BookingHold", bookingHoldSchema);
export default BookingHold;


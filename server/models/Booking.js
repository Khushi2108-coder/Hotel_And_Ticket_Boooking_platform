import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const bookingSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true, sparse: true },
    isDemo: { type: Boolean, default: false },

    reference: {
      type: String,
      unique: true,
      uppercase: true,
    }, // SE-XXXXXX – auto-generated

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    holdId: { type: mongoose.Schema.Types.ObjectId, ref: "BookingHold" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    // Flat fields preserved for backward compatibility
    hotelName: { type: String, default: "" },
    hotelCity: { type: String, default: "" },
    hotelImage: { type: String, default: "" },
    roomName: { type: String, default: "" },
    roomPrice: { type: Number },
    subtotal: { type: Number },
    taxes: { type: Number },
    total: { type: Number },

    guestDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    checkInTime: { type: String, default: "14:00" }, // for same-day stays
    checkOutTime: { type: String, default: "11:00" },
    isSameDay: { type: Boolean, default: false },

    rooms: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },

    pricing: {
      baseAmount: { type: Number, required: true },
      weekendSurcharge: { type: Number, default: 0 },
      seasonalSurcharge: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      pointsDiscount: { type: Number, default: 0 },
      taxes: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
    },

    pointsRedeemed: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
      default: "pending",
      set: (v) => (v ? v.toLowerCase() : v),
    },

    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: "" },
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["not_applicable", "pending", "processed", "failed"],
      default: "not_applicable",
    },

    specialRequests: { type: String, default: "" },
    voucherUrl: { type: String, default: "" }, // Cloudinary PDF URL
  },
  { timestamps: true }
);

// Auto-normalize flat legacy fields to structured fields if needed
bookingSchema.pre("validate", function (next) {
  if (this.status) {
    this.status = this.status.toLowerCase();
  }

  // Populate guestDetails from flat fields if needed
  if (!this.guestDetails?.name || !this.guestDetails?.email || !this.guestDetails?.phone) {
    this.set("guestDetails", {
      name: this.guestDetails?.name || this.guestName || "Guest",
      email: this.guestDetails?.email || this.email || "guest@stayease.com",
      phone: this.guestDetails?.phone || this.phone || "+91 0000000000",
    });
  }

  // Populate pricing from flat fields if needed
  if (!this.pricing?.baseAmount || !this.pricing?.totalAmount) {
    const base = this.subtotal !== undefined ? this.subtotal : (this.total || 0);
    const tax = this.taxes !== undefined ? this.taxes : 0;
    const tot = this.total !== undefined ? this.total : base + tax;
    this.set("pricing", {
      baseAmount: this.pricing?.baseAmount ?? base,
      taxes: this.pricing?.taxes ?? tax,
      totalAmount: this.pricing?.totalAmount ?? tot,
      weekendSurcharge: this.pricing?.weekendSurcharge ?? 0,
      seasonalSurcharge: this.pricing?.seasonalSurcharge ?? 0,
      couponDiscount: this.pricing?.couponDiscount ?? 0,
      pointsDiscount: this.pricing?.pointsDiscount ?? 0,
    });
  }

  // Populate flat fields from pricing/guestDetails if missing
  if (this.pricing && this.total === undefined) {
    this.total = this.pricing.totalAmount;
    this.subtotal = this.pricing.baseAmount;
    this.taxes = this.pricing.taxes;
  }

  // Auto-generate reference if not set
  if (!this.reference) {
    this.reference = `SE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  next();
});

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });

bookingSchema.plugin(mongoosePaginate);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;


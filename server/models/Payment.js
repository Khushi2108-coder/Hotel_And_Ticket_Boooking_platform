import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    holdId: { type: mongoose.Schema.Types.ObjectId, ref: "BookingHold" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Razorpay identifiers
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: { type: String, sparse: true },
    razorpaySignature: { type: String },

    // Amount is stored in PAISE (₹1 = 100 paise)
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
    },

    method: { type: String, default: "" }, // 'upi', 'card', 'netbanking', 'wallet'
    webhookVerified: { type: Boolean, default: false },

    // Prevents double-processing of webhooks
    idempotencyKey: { type: String, sparse: true, unique: true },

    failureReason: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
paymentSchema.index({ userId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;


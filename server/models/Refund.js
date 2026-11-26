import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Razorpay refund ID (set when Razorpay processes the refund)
    razorpayRefundId: { type: String, sparse: true },

    // Amount in PAISE
    amount: { type: Number, required: true },

    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    processedAt: { type: Date },

    // Refund policy applied
    policyApplied: {
      type: String,
      enum: ["flexible", "moderate", "strict", "manual"],
      default: "moderate",
    },
    refundPercent: { type: Number, default: 0 }, // 0-100
  },
  { timestamps: true }
);

refundSchema.index({ bookingId: 1 });
refundSchema.index({ paymentId: 1 });
refundSchema.index({ status: 1 });

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;


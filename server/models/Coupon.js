import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: "" },

    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: { type: Number }, // cap for percent discounts (e.g. max ₹500 off)

    minBookingAmount: { type: Number, default: 0 }, // in rupees

    maxUses: { type: Number }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    validFrom: { type: Date },
    validTo: { type: Date },

    // empty array = applicable to all hotels
    applicableHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, validTo: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;


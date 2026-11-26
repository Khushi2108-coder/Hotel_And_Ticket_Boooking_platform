import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
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
    name: { type: String, required: true }, // "Weekend Premium", "Summer Season"
    type: {
      type: String,
      enum: ["weekend", "seasonal", "length_of_stay", "special_event"],
      required: true,
    },

    // For seasonal / special_event rules
    startDate: { type: Date },
    endDate: { type: Date },

    // For weekend rules: [0=Sun, 1=Mon, ..., 6=Sat]
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],

    // For length_of_stay rules
    minNights: { type: Number, min: 1 },

    // Price change
    priceModifier: {
      type: Number,
      required: [true, "Price modifier is required"],
    },
    modifierType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    }, // percent: +20% | fixed: +500

    // Higher priority rules are applied first
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pricingRuleSchema.index({ roomId: 1, isActive: 1 });
pricingRuleSchema.index({ hotelId: 1 });
pricingRuleSchema.index({ type: 1 });

const PricingRule = mongoose.model("PricingRule", pricingRuleSchema);
export default PricingRule;


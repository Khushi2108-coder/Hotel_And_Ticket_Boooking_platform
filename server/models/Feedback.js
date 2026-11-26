import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true, sparse: true },
    isDemo: { type: Boolean, default: false },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    location: {
      type: String,
      default: "India",
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    hotelStayed: {
      type: String,
      default: "StayEase Luxury Stay",
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    },
    badge: {
      type: String,
      default: "Verified Guest",
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ rating: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;

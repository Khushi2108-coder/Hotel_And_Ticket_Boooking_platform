import mongoose from "mongoose";

const blockedDateSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    }, // midnight UTC
    reason: {
      type: String,
      enum: ["maintenance", "owner_block", "seasonal_close", "other"],
      default: "owner_block",
    },
    note: { type: String, default: "" },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One block record per room per date
blockedDateSchema.index({ roomId: 1, date: 1 }, { unique: true });
blockedDateSchema.index({ hotelId: 1, date: 1 });

const BlockedDate = mongoose.model("BlockedDate", blockedDateSchema);
export default BlockedDate;


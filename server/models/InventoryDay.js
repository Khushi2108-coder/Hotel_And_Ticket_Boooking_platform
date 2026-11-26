import mongoose from "mongoose";

/**
 * InventoryDay – one document per room per date.
 * This is the core of the availability engine.
 * Use atomic $inc operations for concurrency-safe inventory management.
 *
 * NEVER manually set `available` without a transaction.
 * Always use $inc to increment/decrement.
 */
const inventoryDaySchema = new mongoose.Schema(
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
    }, // Always stored as midnight UTC: new Date("YYYY-MM-DD")
    available: {
      type: Number,
      required: true,
      min: 0,
    }, // Current available rooms (starts = Room.totalInventory)
    blocked: { type: Boolean, default: false }, // Owner-blocked (maintenance etc.)
    blockReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Critical: compound unique index ensures one doc per room per date
inventoryDaySchema.index({ roomId: 1, date: 1 }, { unique: true });
inventoryDaySchema.index({ hotelId: 1, date: 1 });

const InventoryDay = mongoose.model("InventoryDay", inventoryDaySchema);
export default InventoryDay;


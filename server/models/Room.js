import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const roomSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true, sparse: true },
    isDemo: { type: Boolean, default: false },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel reference is required"],
    },
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
    }, // e.g. "Deluxe King", "Ocean Suite"
    type: {
      type: String,
      enum: ["standard", "deluxe", "suite", "villa", "dormitory"],
      required: [true, "Room type is required"],
    },
    bedConfiguration: { type: String, default: "1 Double Bed" }, // "1 King Bed", "2 Twin Beds"
    capacity: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0 },
    },
    size: { type: Number }, // sq ft
    basePrice: {
      type: Number,
      required: [true, "Base price per night is required"],
      min: 0,
    },
    totalInventory: {
      type: Number,
      required: [true, "Total inventory is required"],
      min: 1,
    }, // physical rooms of this type
    amenities: [{ type: String }],
    images: [{ type: String }], // Cloudinary URLs
    isActive: { type: Boolean, default: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

roomSchema.index({ hotelId: 1, isActive: 1 });
roomSchema.index({ hotelId: 1, type: 1 });

roomSchema.plugin(mongoosePaginate);

const Room = mongoose.model("Room", roomSchema);
export default Room;


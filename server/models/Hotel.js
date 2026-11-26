import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const hotelSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, index: true, sparse: true },
    isDemo: { type: Boolean, default: false },
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: String,
      enum: ["hotel", "resort", "villa", "hostel", "apartment"],
      required: [true, "Category is required"],
      default: "hotel",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    isActive: { type: Boolean, default: true },
    city: { type: String, default: "" }, // Top-level shortcut for JSON DB compatibility
    location: {
      address: { type: String, default: "" },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
      pincode: { type: String, default: "" },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    image: { type: String, default: "" }, // Single main image for JSON DB compatibility
    images: [{ type: String }], // Cloudinary URLs
    amenities: [{ type: String }],
    policies: {
      checkInTime: { type: String, default: "14:00" },
      checkOutTime: { type: String, default: "11:00" },
      cancellation: {
        type: String,
        enum: ["flexible", "moderate", "strict"],
        default: "moderate",
      },
    },
    // Aggregated stats (updated via virtuals or background jobs)
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // Legacy field (from JSON DB) for search compatibility
    price: { type: Number }, // base starting price (derived from cheapest room)
  },
  { timestamps: true }
);

// Keep image and images in sync, and ensure city is populated
hotelSchema.pre("validate", function (next) {
  if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  } else if (!this.image && this.images && this.images.length > 0) {
    this.image = this.images[0];
  }

  if (!this.city && this.location?.city) {
    this.city = this.location.city;
  } else if (this.city && (!this.location || !this.location.city)) {
    this.location = { ...this.location, city: this.city };
  }
  next();
});

// Text search index
hotelSchema.index({ name: "text", description: "text", "location.city": "text" });
hotelSchema.index({ "location.city": 1 });
hotelSchema.index({ approvalStatus: 1, isActive: 1 });
hotelSchema.index({ ownerId: 1 });

hotelSchema.plugin(mongoosePaginate);

const Hotel = mongoose.model("Hotel", hotelSchema);
export default Hotel;


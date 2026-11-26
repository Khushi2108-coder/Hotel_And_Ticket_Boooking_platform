import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true, sparse: true },
    isDemo: { type: Boolean, default: false },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Username is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries by default
    },
    phone: { type: String, default: "", trim: true },
    dateOfBirth: { type: Date },
    city: { type: String, default: "", trim: true },
    avatar: { type: String, default: "" }, // Base64 or Cloudinary URL
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    loyaltyPoints: { type: Number, default: 100 },
    tier: {
      type: String,
      enum: [
        "Bronze",
        "Silver",
        "Gold",
        "Platinum",
        "Bronze Member",
        "Silver Explorer",
        "Gold Explorer",
        "Platinum Elite",
      ],
      default: "Silver Explorer",
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }],
    isActive: { type: Boolean, default: true },

    // Password reset fields (stored as SHA-256 hash)
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    // Refresh token storage (stored as SHA-256 hash for protection against db leak)
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

// Hash password before saving, unless already hashed (e.g. during JSON database migration)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // If already a valid bcrypt hash, do not re-hash (prevents corruption of migrated hashes)
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password)) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: generate and hash password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate a cryptographically secure random token (32 bytes)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token using SHA-256 before saving to the database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiry to 1 hour from now
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

  return resetToken; // Return the plain token to be sent to user via email/link
};

// Update loyalty tier based on points
userSchema.methods.updateTier = function () {
  const pts = this.loyaltyPoints;
  if (pts >= 10000) this.tier = "Platinum";
  else if (pts >= 5000) this.tier = "Gold";
  else if (pts >= 1000) this.tier = "Silver";
  else this.tier = "Bronze";
};

const User = mongoose.model("User", userSchema);
export default User;

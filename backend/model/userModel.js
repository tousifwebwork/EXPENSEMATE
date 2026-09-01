const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: "" },
    phone: { type: String, default: "" },
    preferredCurrency: { type: String, default: "INR" },
    profileId: { type: String, required: true, unique: true },
    about: { type: String, default: "", trim: true, maxlength: 300 },
    address: {
      landmark: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      country: { type: String, default: "", trim: true },
    },
    status: {
      type: String,
      enum: ["active", "deactivated", "blocked"],
      default: "active",
    },
    verificationCode: { type: String, default: "" },
    verificationCodeExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
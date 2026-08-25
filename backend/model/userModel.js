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
    status: {
      type: String,
      enum: ["active", "deactivated", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    profileImage: String,
    phone: String,
    preferredCurrency: String,
    status: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
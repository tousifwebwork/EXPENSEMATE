const mongoose = require("mongoose");
const { generateProfileId } = require("../utils/generateProfileId");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    passwordHash: { type: String, select: false },
    phone: { type: String, default: "" },
    profileId: { type: String, unique: true, sparse: true },
    preferredCurrency: { type: String, default: "INR" },
    profileImage: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ url: "", publicId: "" }),
    },
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

userSchema.pre("save", async function () {
  if (!this.profileId) {
    let profileId;
    let isUnique = false;
    while (!isUnique) {
      profileId = generateProfileId();
      const existing = await mongoose.models.User?.findOne({ profileId });
      if (!existing) isUnique = true;
    }
    this.profileId = profileId;
  }

  if (typeof this.profileImage === "string") {
    this.profileImage = { url: this.profileImage, publicId: "" };
  }
});

module.exports = mongoose.model("User", userSchema);
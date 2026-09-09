const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    preferredCurrency: {
      type: String,
      default: 'INR',
    },
    accountStatus: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
    platformRole: {
      type: String,
      enum: ['platformAdmin', 'user'],
      default: 'user',
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);

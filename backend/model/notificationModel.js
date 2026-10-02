const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accepted",
        "group_invite",
        "expense_added",
        "expense_updated",
        "expense_deleted",
        "settlement_recorded",
      ],
      required: true,
    },
    message: { type: String, required: true },
    relatedGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who triggered it
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
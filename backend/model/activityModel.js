const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who did it
    action: {
      type: String,
      enum: [
        "group_created",
        "group_updated",
        "member_added",
        "member_removed",
        "member_role_changed",
        "expense_added",
        "expense_updated",
        "expense_deleted",
        "settlement_recorded",
        "settlement_updated",
        "settlement_deleted",
      ],
      required: true,
    },
    description: { type: String, required: true }, // human-readable summary
    metadata: { type: mongoose.Schema.Types.Mixed }, // optional old/new values
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
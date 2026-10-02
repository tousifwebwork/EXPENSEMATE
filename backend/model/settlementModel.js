const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // who paid
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who received
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);
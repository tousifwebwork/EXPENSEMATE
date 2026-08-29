const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "INR" },
    category: {
      type: String,
      enum: ["Food", "Travel", "Shopping", "Rent", "Utilities", "Entertainment", "Accommodation", "Medical", "Other"],
      default: "Other",
    },
    date: { type: Date, default: Date.now },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage"],
      required: true,
    },
    shares: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        percentage: { type: Number },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiptUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    category: {
      type: String,
      enum: ['Food', 'Travel', 'Shopping', 'Rent', 'Utilities', 'Entertainment', 'Accommodation', 'Medical', 'Other'],
      default: 'Other',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    time: {
      type: String,
      default: '',
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal',
    },
    shares: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
      },
    ],
    receipt: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    tags: [{ type: String }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ payer: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

// Only one non-terminal (pending/accepted) relationship should exist between
// two users at a time; declined/cancelled requests are reused/updated in the
// controller rather than left around to collide with a fresh request.
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
module.exports = mongoose.model('FriendRequest', friendRequestSchema);

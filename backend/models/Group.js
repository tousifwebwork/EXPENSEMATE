const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    cover: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    baseCurrency: {
      type: String,
      default: 'INR',
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

groupSchema.index({ owner: 1 });
groupSchema.index({ members: 1 });

groupSchema.methods.isMember = function (userId) {
  return this.members.some((memberId) => memberId.toString() === userId.toString());
};

module.exports = mongoose.model('Group', groupSchema);

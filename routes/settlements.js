const express = require('express');
const router = express.Router();
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/settlements
// @desc Record a settlement
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, amount, groupId, note } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(req.user.id) || !group.members.includes(receiverId)) {
      return res.status(401).json({ message: 'Both users must be in the group' });
    }

    const settlement = await Settlement.create({
      payer: req.user.id,
      receiver: receiverId,
      amount,
      group: groupId,
      note
    });

    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/settlements/group/:id
// @desc Get all settlements for a group
router.get('/group/:id', protect, async (req, res) => {
  try {
    const settlements = await Settlement.find({ group: req.params.id })
      .populate('payer', 'name')
      .populate('receiver', 'name')
      .sort({ date: -1 });
    res.status(200).json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/expenses
// @desc Add a new expense
router.post('/', protect, async (req, res) => {
  try {
    const { title, amount, groupId, participants, category, splitType, splitDetails } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized to add expense to this group' });
    }

    const expense = await Expense.create({
      title,
      amount,
      group: groupId,
      payer: req.user.id,
      participants: participants || group.members,
      category: category || 'Other',
      splitType: splitType || 'EQUAL',
      splitDetails: splitDetails || []
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/expenses/group/:id
// @desc Get all expenses for a group
router.get('/group/:id', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.id })
      .populate('payer', 'name')
      .populate('participants', 'name')
      .sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

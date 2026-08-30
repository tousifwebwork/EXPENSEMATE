const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/authMiddleware');

// @route GET /api/groups
// @desc Get all groups for a user
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id });
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/groups
// @desc Create a group
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      members: [req.user.id] // Creator is added by default
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/groups/:id
// @desc Get group details (with members)
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is part of group
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(401).json({ message: 'Not authorized to view this group' });
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/groups/:id/members
// @desc Add a member to the group by email
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);
    
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Check authorization
    if (!group.members.includes(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push(userToAdd._id);
    await group.save();
    
    res.status(200).json(await Group.findById(req.params.id).populate('members', 'name email'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const Settlement = require('../models/Settlement');

// @route GET /api/groups/:id/balances
// @desc Get balances for a group
router.get('/:id/balances', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const expenses = await Expense.find({ group: req.params.id });
    const settlements = await Settlement.find({ group: req.params.id });
    
    // Calculate balances
    const balances = {};
    group.members.forEach(member => {
      balances[member.toString()] = 0; // initialize
    });

    expenses.forEach(exp => {
      // Payer gets positive balance for the amount they paid
      if(balances[exp.payer.toString()] !== undefined) {
         balances[exp.payer.toString()] += exp.amount;
      }
      
      if (exp.splitType === 'EQUAL') {
        const amountPerPerson = exp.amount / exp.participants.length;
        exp.participants.forEach(participant => {
          if(balances[participant.toString()] !== undefined) {
             balances[participant.toString()] -= amountPerPerson;
          }
        });
      } else if (exp.splitType === 'EXACT') {
        exp.splitDetails.forEach(detail => {
          if(balances[detail.user.toString()] !== undefined) {
             balances[detail.user.toString()] -= detail.amount;
          }
        });
      } else if (exp.splitType === 'PERCENTAGE') {
        exp.splitDetails.forEach(detail => {
          if(balances[detail.user.toString()] !== undefined) {
             const amountOwed = (exp.amount * detail.percentage) / 100;
             balances[detail.user.toString()] -= amountOwed;
          }
        });
      }
    });

    // Account for settlements
    settlements.forEach(settle => {
      if(balances[settle.payer.toString()] !== undefined) {
        balances[settle.payer.toString()] += settle.amount;
      }
      if(balances[settle.receiver.toString()] !== undefined) {
        balances[settle.receiver.toString()] -= settle.amount;
      }
    });

    res.status(200).json(balances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

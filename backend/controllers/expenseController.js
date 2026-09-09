const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { getUserShareMap } = require('../services/balanceService');
const { can } = require('../services/permissionService');

const VALID_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Rent', 'Utilities', 'Entertainment', 'Accommodation', 'Medical', 'Other'];
const VALID_SPLIT_TYPES = ['equal', 'exact', 'percentage'];

async function assertGroupMembership(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.status = 404;
    throw error;
  }
  // Platform admins have visibility per the roles matrix even without
  // explicit group membership.
  const isPlatformAdmin = userId.platformRole === 'platformAdmin';
  const rawId = (userId._id || userId).toString();
  if (!isPlatformAdmin && !group.members.some((memberId) => memberId.toString() === rawId)) {
    const error = new Error('You do not belong to this group');
    error.status = 403;
    throw error;
  }
  return group;
}

function buildSharesFromMap(shareMap) {
  return Object.entries(shareMap).map(([user, amount]) => ({ user, amount }));
}

function validateExpensePayload(body) {
  const { title, amount, payer, participants, splitType = 'equal', category = 'Other', shares: rawShares = [] } = body;

  if (!title || !title.trim()) {
    return { error: 'Expense title is required' };
  }

  const numericAmount = Number(amount);
  if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
    return { error: 'Expense amount must be greater than zero' };
  }

  if (!payer) {
    return { error: 'Payer is required' };
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { error: 'At least one participant must be selected' };
  }

  if (!VALID_SPLIT_TYPES.includes(splitType)) {
    return { error: 'Invalid split type' };
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return { error: 'Invalid category' };
  }

  if (splitType !== 'equal' && (!Array.isArray(rawShares) || rawShares.length === 0)) {
    return { error: `Shares are required for a ${splitType} split` };
  }

  if (splitType !== 'equal') {
    const participantSet = new Set(participants.map((id) => id.toString()));
    const shareUserSet = new Set(rawShares.map((share) => (share.user || '').toString()));
    const missing = [...participantSet].filter((id) => !shareUserSet.has(id));
    if (missing.length > 0) {
      return { error: 'Every participant must have a share amount' };
    }
  }

  return { numericAmount, title, payer, participants, splitType, category, rawShares };
}

async function createExpense(req, res) {
  try {
    const validation = validateExpensePayload(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const { numericAmount, title, payer, participants, splitType, category, rawShares } = validation;
    const { description = '', currency, date, time = '', notes = '', tags = [], receipt = '' } = req.body;

    const group = await assertGroupMembership(req.params.groupId, req.user);

    if (!group.members.some((id) => id.toString() === payer.toString())) {
      return res.status(400).json({ success: false, message: 'Payer must be a member of the group' });
    }

    const invalidParticipant = participants.find(
      (participantId) => !group.members.some((id) => id.toString() === participantId.toString()),
    );
    if (invalidParticipant) {
      return res.status(400).json({ success: false, message: 'All participants must be members of the group' });
    }

    let shareMap;
    try {
      shareMap = getUserShareMap(participants, splitType, numericAmount, rawShares);
    } catch (shareError) {
      return res.status(400).json({ success: false, message: shareError.message });
    }

    const expense = await Expense.create({
      group: group._id,
      title: title.trim(),
      description,
      amount: numericAmount,
      currency: currency || group.baseCurrency,
      category,
      date: date || Date.now(),
      time,
      payer,
      participants,
      splitType,
      shares: buildSharesFromMap(shareMap),
      receipt,
      notes,
      tags,
      createdBy: req.user._id,
    });

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'expense_created',
      relatedEntity: expense._id,
      relatedModel: 'Expense',
      newValue: { title: expense.title, amount: expense.amount },
    });

    return res.status(201).json({ success: true, expense });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
}

async function listExpenses(req, res) {
  try {
    const group = await assertGroupMembership(req.params.groupId, req.user);

    const { category, payer, participant, splitType, search, startDate, endDate, sortBy = 'date', order = 'desc' } = req.query;

    const filter = { group: group._id };
    if (category) filter.category = category;
    if (payer) filter.payer = payer;
    if (participant) filter.participants = participant;
    if (splitType) filter.splitType = splitType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortableFields = ['date', 'amount', 'category', 'updatedAt'];
    const sortField = sortableFields.includes(sortBy) ? sortBy : 'date';
    const sortOrder = order === 'asc' ? 1 : -1;

    const expenses = await Expense.find(filter)
      .sort({ [sortField]: sortOrder })
      .populate('payer participants', 'name email')
      .populate('createdBy', 'name email');

    return res.json({ success: true, expenses });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
}

async function getExpenseById(req, res) {
  try {
    const expense = await Expense.findById(req.params.id).populate('payer participants', 'name email');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await assertGroupMembership(expense.group, req.user);

    return res.json({ success: true, expense });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
}

function canModifyExpense(expense, group, user) {
  const isCreator = expense.createdBy.toString() === user._id.toString();
  if (isCreator && can(user, group, 'EDIT_DELETE_OWN_EXPENSE')) return true;
  return can(user, group, 'EDIT_DELETE_ANY_EXPENSE');
}

async function updateExpense(req, res) {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await assertGroupMembership(expense.group, req.user);

    const allowed = canModifyExpense(expense, group, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this expense' });
    }

    const merged = {
      title: req.body.title ?? expense.title,
      amount: req.body.amount ?? expense.amount,
      payer: req.body.payer ?? expense.payer.toString(),
      participants: req.body.participants ?? expense.participants.map((id) => id.toString()),
      splitType: req.body.splitType ?? expense.splitType,
      category: req.body.category ?? expense.category,
      shares: req.body.shares ?? expense.shares.map((s) => ({ user: s.user.toString(), amount: s.amount })),
    };

    const validation = validateExpensePayload(merged);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const { numericAmount, title, payer, participants, splitType, category, rawShares } = validation;

    if (!group.members.some((id) => id.toString() === payer.toString())) {
      return res.status(400).json({ success: false, message: 'Payer must be a member of the group' });
    }
    const invalidParticipant = participants.find(
      (participantId) => !group.members.some((id) => id.toString() === participantId.toString()),
    );
    if (invalidParticipant) {
      return res.status(400).json({ success: false, message: 'All participants must be members of the group' });
    }

    let shareMap;
    try {
      shareMap = getUserShareMap(participants, splitType, numericAmount, rawShares);
    } catch (shareError) {
      return res.status(400).json({ success: false, message: shareError.message });
    }

    const previousValue = {
      title: expense.title,
      amount: expense.amount,
      splitType: expense.splitType,
      shares: expense.shares,
    };

    expense.title = title.trim();
    expense.amount = numericAmount;
    expense.payer = payer;
    expense.participants = participants;
    expense.splitType = splitType;
    expense.category = category;
    expense.shares = buildSharesFromMap(shareMap);
    if (req.body.description !== undefined) expense.description = req.body.description;
    if (req.body.date !== undefined) expense.date = req.body.date;
    if (req.body.time !== undefined) expense.time = req.body.time;
    if (req.body.notes !== undefined) expense.notes = req.body.notes;
    if (req.body.tags !== undefined) expense.tags = req.body.tags;
    if (req.body.receipt !== undefined) expense.receipt = req.body.receipt;

    await expense.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'expense_updated',
      relatedEntity: expense._id,
      relatedModel: 'Expense',
      previousValue,
      newValue: { title: expense.title, amount: expense.amount, splitType: expense.splitType, shares: expense.shares },
    });

    return res.json({ success: true, expense });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
}

async function deleteExpense(req, res) {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await assertGroupMembership(expense.group, req.user);

    const allowed = canModifyExpense(expense, group, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this expense' });
    }

    await Expense.deleteOne({ _id: expense._id });

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'expense_deleted',
      relatedEntity: expense._id,
      relatedModel: 'Expense',
      previousValue: { title: expense.title, amount: expense.amount },
    });

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
}

module.exports = {
  createExpense,
  listExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};

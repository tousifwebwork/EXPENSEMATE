const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { resolveRole, ROLES } = require('../services/permissionService');

async function assertGroupMembership(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.status = 404;
    throw error;
  }
  const isPlatformAdmin = userId.platformRole === 'platformAdmin';
  const rawId = (userId._id || userId).toString();
  if (!isPlatformAdmin && !group.members.some((memberId) => memberId.toString() === rawId)) {
    const error = new Error('You do not belong to this group');
    error.status = 403;
    throw error;
  }
  return group;
}

async function createSettlement(req, res) {
  try {
    const { payer, receiver, amount, note = '', date } = req.body;
    const numericAmount = Number(amount);

    if (!payer || !receiver) {
      return res.status(400).json({ success: false, message: 'Payer and receiver are required' });
    }
    if (payer === receiver) {
      return res.status(400).json({ success: false, message: 'Payer and receiver must be different users' });
    }
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Settlement amount must be greater than zero' });
    }

    const group = await assertGroupMembership(req.params.groupId, req.user);

    if (!group.members.some((id) => id.toString() === payer.toString())) {
      return res.status(400).json({ success: false, message: 'Payer must be a member of the group' });
    }
    if (!group.members.some((id) => id.toString() === receiver.toString())) {
      return res.status(400).json({ success: false, message: 'Receiver must be a member of the group' });
    }

    const settlement = await Settlement.create({
      group: group._id,
      payer,
      receiver,
      amount: numericAmount,
      note,
      date: date || Date.now(),
      status: 'completed',
      createdBy: req.user._id,
    });

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'settlement_recorded',
      relatedEntity: settlement._id,
      relatedModel: 'Settlement',
      newValue: { payer, receiver, amount: numericAmount },
    });

    return res.status(201).json({ success: true, settlement });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to record settlement' });
  }
}

async function listSettlements(req, res) {
  try {
    const group = await assertGroupMembership(req.params.groupId, req.user);

    const settlements = await Settlement.find({ group: group._id })
      .sort({ date: -1 })
      .populate('payer receiver', 'name email')
      .populate('createdBy', 'name email');

    return res.json({ success: true, settlements });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch settlements' });
  }
}

async function updateSettlement(req, res) {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    const group = await assertGroupMembership(settlement.group, req.user);

    const role = resolveRole(req.user, group);
    const isOwnerOrAdmin = [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN].includes(role);
    const isCreator = settlement.createdBy.toString() === req.user._id.toString();

    if (!isOwnerOrAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this settlement' });
    }

    const previousValue = {
      payer: settlement.payer,
      receiver: settlement.receiver,
      amount: settlement.amount,
      note: settlement.note,
      status: settlement.status,
    };

    if (req.body.amount !== undefined) {
      const numericAmount = Number(req.body.amount);
      if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Settlement amount must be greater than zero' });
      }
      settlement.amount = numericAmount;
    }
    if (req.body.note !== undefined) settlement.note = req.body.note;
    if (req.body.date !== undefined) settlement.date = req.body.date;
    if (req.body.status !== undefined) {
      if (!['pending', 'completed', 'cancelled'].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid settlement status' });
      }
      settlement.status = req.body.status;
    }

    await settlement.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'settlement_updated',
      relatedEntity: settlement._id,
      relatedModel: 'Settlement',
      previousValue,
      newValue: { amount: settlement.amount, note: settlement.note, status: settlement.status },
    });

    return res.json({ success: true, settlement });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update settlement' });
  }
}

async function deleteSettlement(req, res) {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    const group = await assertGroupMembership(settlement.group, req.user);

    const role = resolveRole(req.user, group);
    const isOwnerOrAdmin = [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN].includes(role);
    const isCreator = settlement.createdBy.toString() === req.user._id.toString();

    if (!isOwnerOrAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this settlement' });
    }

    await Settlement.deleteOne({ _id: settlement._id });

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'settlement_deleted',
      relatedEntity: settlement._id,
      relatedModel: 'Settlement',
      previousValue: { payer: settlement.payer, receiver: settlement.receiver, amount: settlement.amount },
    });

    return res.json({ success: true, message: 'Settlement deleted successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete settlement' });
  }
}

module.exports = {
  createSettlement,
  listSettlements,
  updateSettlement,
  deleteSettlement,
};

const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Activity = require('../models/Activity');
const { calculateGroupBalances, simplifySettlementSuggestions } = require('../services/balanceService');
const { can } = require('../services/permissionService');

async function loadGroupOrThrow(groupId) {
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.status = 404;
    throw error;
  }
  return group;
}

function isVisibleTo(user, group) {
  // A user can see a group if they belong to it in some capacity, or if
  // they are a platform admin (platform-level authorization per spec).
  if (user.platformRole === 'platformAdmin') return true;
  const userId = user._id.toString();
  return (
    group.owner.toString() === userId ||
    group.admins.some((id) => id.toString() === userId) ||
    group.members.some((id) => id.toString() === userId)
  );
}

async function createGroup(req, res) {
  try {
    const { name, description = '', baseCurrency = 'INR' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const group = await Group.create({
      name: name.trim(),
      description,
      owner: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      baseCurrency,
    });

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'group_created',
      relatedEntity: group._id,
      relatedModel: 'Group',
      newValue: { name: group.name },
    });

    return res.status(201).json({ success: true, group });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create group' });
  }
}

async function getGroups(req, res) {
  try {
    // Platform admins can see every group; everyone else sees only groups
    // they belong to in some capacity.
    const filter = req.user.platformRole === 'platformAdmin' ? {} : { members: req.user._id };
    const groups = await Group.find(filter).populate('owner admins members', 'name email');
    return res.json({ success: true, groups });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
}

async function getGroupById(req, res) {
  try {
    const group = await Group.findById(req.params.id).populate('owner admins members', 'name email');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!isVisibleTo(req.user, group)) {
      return res.status(403).json({ success: false, message: 'You do not belong to this group' });
    }

    return res.json({ success: true, group });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch group' });
  }
}

async function updateGroup(req, res) {
  try {
    const group = await loadGroupOrThrow(req.params.id);

    if (!can(req.user, group, 'EDIT_GROUP_DETAILS')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this group' });
    }

    const previousValue = { name: group.name, description: group.description, baseCurrency: group.baseCurrency };

    const { name, description, baseCurrency, icon, cover } = req.body;
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Group name is required' });
      }
      group.name = name.trim();
    }
    if (description !== undefined) group.description = description;
    if (baseCurrency !== undefined) group.baseCurrency = baseCurrency;
    if (icon !== undefined) group.icon = icon;
    if (cover !== undefined) group.cover = cover;

    await group.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'group_updated',
      relatedEntity: group._id,
      relatedModel: 'Group',
      previousValue,
      newValue: { name: group.name, description: group.description, baseCurrency: group.baseCurrency },
    });

    return res.json({ success: true, group });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update group' });
  }
}

async function addMember(req, res) {
  try {
    const { userId } = req.body;
    const group = await loadGroupOrThrow(req.params.id);

    if (!can(req.user, group, 'MANAGE_GROUP_MEMBERS')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to add members' });
    }

    if (group.members.some((member) => member.toString() === userId)) {
      return res.status(409).json({ success: false, message: 'User already belongs to the group' });
    }

    const member = await User.findById(userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    group.members.push(member._id);
    await group.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'member_added',
      relatedEntity: member._id,
      relatedModel: 'User',
      newValue: { userId: member._id, name: member.name },
    });

    return res.json({ success: true, message: 'Member added successfully', group });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to add member' });
  }
}

async function removeMember(req, res) {
  try {
    const { userId } = req.params;
    const group = await loadGroupOrThrow(req.params.id);

    if (!can(req.user, group, 'MANAGE_GROUP_MEMBERS')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to remove members' });
    }

    if (group.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'The group owner cannot be removed from the group' });
    }

    if (!group.members.some((id) => id.toString() === userId)) {
      return res.status(404).json({ success: false, message: 'User is not a member of this group' });
    }

    // Removing a member must not erase historical expense/settlement data —
    // those documents reference the user by id independently of group.members,
    // so simply pulling them from this array preserves all history.
    group.members = group.members.filter((id) => id.toString() !== userId);
    group.admins = group.admins.filter((id) => id.toString() !== userId);
    await group.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: 'member_removed',
      relatedEntity: userId,
      relatedModel: 'User',
    });

    return res.json({ success: true, message: 'Member removed successfully', group });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
}

async function setMemberAdminStatus(req, res) {
  try {
    const { userId } = req.params;
    const { makeAdmin } = req.body; // boolean
    const group = await loadGroupOrThrow(req.params.id);

    if (!can(req.user, group, 'PROMOTE_DEMOTE_GROUP_ADMINS')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to change admin roles' });
    }

    if (!group.members.some((id) => id.toString() === userId)) {
      return res.status(404).json({ success: false, message: 'User is not a member of this group' });
    }

    if (group.owner.toString() === userId) {
      return res
        .status(400)
        .json({ success: false, message: 'The group owner is already the highest authority in this group' });
    }

    const isCurrentlyAdmin = group.admins.some((id) => id.toString() === userId);

    if (makeAdmin && !isCurrentlyAdmin) {
      group.admins.push(userId);
    } else if (!makeAdmin && isCurrentlyAdmin) {
      group.admins = group.admins.filter((id) => id.toString() !== userId);
    }

    await group.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: makeAdmin ? 'member_promoted_to_admin' : 'member_demoted_from_admin',
      relatedEntity: userId,
      relatedModel: 'User',
    });

    return res.json({ success: true, message: 'Group admin roles updated', group });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update admin roles' });
  }
}

async function archiveGroup(req, res) {
  try {
    const group = await loadGroupOrThrow(req.params.id);

    if (!can(req.user, group, 'ARCHIVE_GROUP')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to archive this group' });
    }

    const { archived = true } = req.body;
    group.archived = Boolean(archived);
    await group.save();

    await Activity.create({
      group: group._id,
      actor: req.user._id,
      action: group.archived ? 'group_archived' : 'group_reopened',
      relatedEntity: group._id,
      relatedModel: 'Group',
    });

    return res.json({ success: true, group });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to archive group' });
  }
}

async function getBalances(req, res) {
  try {
    const group = await loadGroupOrThrow(req.params.id);

    if (!isVisibleTo(req.user, group)) {
      return res.status(403).json({ success: false, message: 'You do not belong to this group' });
    }

    const members = await User.find({ _id: { $in: group.members } }).select('_id name email');
    const expenses = await Expense.find({ group: group._id }).select('payer participants shares amount');
    const settlements = await Settlement.find({ group: group._id, status: 'completed' }).select('payer receiver amount');

    const balances = calculateGroupBalances(members, expenses, settlements);
    const suggestions = simplifySettlementSuggestions(balances);

    return res.json({ success: true, balances, suggestions });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to calculate balances' });
  }
}

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addMember,
  removeMember,
  setMemberAdminStatus,
  archiveGroup,
  getBalances,
};

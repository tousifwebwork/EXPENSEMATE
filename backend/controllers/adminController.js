const User = require('../models/User');

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    preferredCurrency: user.preferredCurrency,
    platformRole: user.platformRole,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
}

async function listUsers(req, res) {
  try {
    const { q = '' } = req.query;
    const filter = q.trim()
      ? { $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] }
      : {};

    const users = await User.find(filter).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    return res.json({ success: true, users: users.map(publicUser) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

async function setPlatformRole(req, res) {
  try {
    const { userId } = req.params;
    const { platformRole } = req.body;

    if (!['platformAdmin', 'user'].includes(platformRole)) {
      return res.status(400).json({ success: false, message: 'platformRole must be platformAdmin or user' });
    }

    if (userId === req.user._id.toString() && platformRole === 'user') {
      return res.status(400).json({ success: false, message: 'You cannot demote your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.platformRole = platformRole;
    await user.save();

    return res.json({ success: true, message: 'User role updated', user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
}

async function setAccountStatus(req, res) {
  try {
    const { userId } = req.params;
    const { accountStatus } = req.body;

    if (!['active', 'deactivated'].includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'accountStatus must be active or deactivated' });
    }

    if (userId === req.user._id.toString() && accountStatus === 'deactivated') {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.accountStatus = accountStatus;
    await user.save();

    return res.json({ success: true, message: 'Account status updated', user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update account status' });
  }
}

/**
 * One-time bootstrap: if the platform has zero platformAdmin users, the
 * currently authenticated user may promote themselves. Once at least one
 * platform admin exists, this route always returns 403 and further
 * promotions must go through setPlatformRole (which requires an existing
 * admin). This avoids a chicken-and-egg problem on a fresh install without
 * leaving a standing "anyone can become admin" hole.
 */
async function bootstrapFirstAdmin(req, res) {
  try {
    const existingAdminCount = await User.countDocuments({ platformRole: 'platformAdmin' });
    if (existingAdminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'A platform admin already exists. Ask an existing admin to grant you access.',
      });
    }

    const user = await User.findById(req.user._id);
    user.platformRole = 'platformAdmin';
    await user.save();

    return res.json({ success: true, message: 'You are now the platform admin', user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to bootstrap admin access' });
  }
}

module.exports = {
  listUsers,
  setPlatformRole,
  setAccountStatus,
  bootstrapFirstAdmin,
};

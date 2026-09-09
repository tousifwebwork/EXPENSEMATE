const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

function createToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.platformRole }, process.env.JWT_SECRET || 'expensemate-dev-secret', {
    expiresIn: '7d',
  });
}

async function register(req, res) {
  try {
    const { name, email, password, phone = '', preferredCurrency = 'INR' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone.trim(),
      preferredCurrency,
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredCurrency: user.preferredCurrency,
        platformRole: user.platformRole,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to register user' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }

    const storedHash = user.passwordHash || user.password;
    if (!storedHash) {
      console.error(`Login attempt blocked for user without password hash: ${user.email}`);
      return res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, storedHash);
    } catch (error) {
      console.error('Password verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }

    if (isPasswordValid && user.passwordHash !== storedHash && user.password) {
      user.passwordHash = storedHash;
      delete user.password;
      await user.save();
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }

    if (user.accountStatus === 'deactivated') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredCurrency: user.preferredCurrency,
        platformRole: user.platformRole,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
}

async function getMe(req, res) {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      preferredCurrency: req.user.preferredCurrency,
      platformRole: req.user.platformRole,
      accountStatus: req.user.accountStatus,
    },
  });
}

async function updateProfile(req, res) {
  try {
    const { name, phone, preferredCurrency } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (preferredCurrency) user.preferredCurrency = preferredCurrency;

    await user.save();

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredCurrency: user.preferredCurrency,
        platformRole: user.platformRole,
        accountStatus: user.accountStatus,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user._id);
    const storedHash = user?.passwordHash || user?.password;
    if (!user || !storedHash) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    let isCurrentPasswordValid = false;
    try {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedHash);
    } catch (error) {
      console.error('Password change verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (isCurrentPasswordValid && user.passwordHash !== storedHash && user.password) {
      user.passwordHash = storedHash;
      delete user.password;
    }

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset token created',
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process password reset' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};

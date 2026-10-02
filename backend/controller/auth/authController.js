
const User = require("../../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateProfileId } = require("../../utils/generateProfileId");
const { verificationCode } = require("../../utils/verificationCode");
const { sendEmail, sendEmail_to_invite } = require("../../utils/sendEmail");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    let profileId;
    let isUnique = false;

    while (!isUnique) {
      profileId = generateProfileId();

      const existing = await User.findOne({ profileId });

      if (!existing) {
        isUnique = true;
      }
    }

    console.log("Generated profileId before create:", profileId);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      profileId,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileId: user.profileId,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};


// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate incoming credentials
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly retrieve password and passwordHash because model may use select: false
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status === "deactivated") {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    const storedHash = user.password || user.passwordHash;

    // Prevent bcrypt from receiving an undefined password hash
    if (typeof storedHash !== "string" || !storedHash) {
      console.error(
        "LOGIN ERROR: Missing password hash for user:",
        user.email
      );

      return res.status(500).json({
        success: false,
        message: "Account password is missing. Please reset your password.",
      });
    }

    // Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(password, storedHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // If user was using legacy passwordHash, migrate to password
    const updates = {};
    if (!user.password && user.passwordHash) {
      updates.password = user.passwordHash;
    }

    // Ensure profileId exists
    if (!user.profileId) {
      let profileId;
      let isUnique = false;
      while (!isUnique) {
        profileId = generateProfileId();
        const existing = await User.findOne({ profileId });
        if (!existing) isUnique = true;
      }
      updates.profileId = profileId;
      user.profileId = profileId;
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: user._id }, { $set: updates, $unset: { passwordHash: "" } });
    }

    // Validate JWT configuration
    if (!process.env.JWT_SECRET) {
      console.error("LOGIN ERROR: JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileId: user.profileId,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


// ME
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// LOGOUT
exports.logout = (req, res) => {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
};


// FORGOT PASSWORD - STEP 1: SEND VERIFICATION CODE
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const code = verificationCode();

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationCode: code,
          verificationCodeExpires: new Date(Date.now() + 5 * 60 * 1000),
        },
      }
    );

    const emailResult = await sendEmail(user.email, code);

    return res.status(200).json({
      success: true,
      message: emailResult.sent
        ? "Verification code sent to your email"
        : "Verification code generated successfully",
      previewCode: code,
    });

  } catch (error) {
    console.error("SEND VERIFICATION CODE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification code",
    });
  }
};


// FORGOT PASSWORD - STEP 2: VERIFY CODE
exports.verifyCode = async (req, res) => {
  try {
    const { email, verifCode } = req.body || {};

    if (!email || !verifCode) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = verifCode.trim().toUpperCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.verificationCode || user.verificationCode.trim().toUpperCase() !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (
      !user.verificationCodeExpires ||
      new Date(user.verificationCodeExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code verified successfully",
    });

  } catch (error) {
    console.error("VERIFY CODE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify code",
    });
  }
};


// FORGOT PASSWORD - STEP 3: RESET PASSWORD + AUTO LOGIN
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, verifCode } = req.body || {};

    if (
      !email ||
      typeof newPassword !== "string" ||
      !newPassword ||
      !verifCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code and new password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = verifCode.trim().toUpperCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.verificationCode || user.verificationCode.trim().toUpperCase() !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (
      !user.verificationCodeExpires ||
      new Date(user.verificationCodeExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateFields = {
      password: hashedPassword,
      verificationCode: "",
      verificationCodeExpires: null,
    };

    if (!user.profileId) {
      let profileId;
      let isUnique = false;
      while (!isUnique) {
        profileId = generateProfileId();
        const existing = await User.findOne({ profileId });
        if (!existing) isUnique = true;
      }
      updateFields.profileId = profileId;
      user.profileId = profileId;
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: updateFields,
        $unset: { passwordHash: "" },
      }
    );

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileId: user.profileId,
      },
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};


// SEND INVITATION EMAIL
exports.sendMail_Invite = async (req, res) => {
  try {
    const { email, inviteText, frontendUrl } = req.body || {};

    const inviterId = req.user.userId;
    const user = await User.findById(inviterId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Inviter account not found",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!frontendUrl) {
      return res.status(400).json({
        success: false,
        message: "Frontend URL is required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    const referralToken = jwt.sign(
      { inviterId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const from = user.email;
    const inviteUrl = `${frontendUrl}/register?ref=${referralToken}`;
    const finalMessage = `${inviteText || ""}\n\nJoin here: ${inviteUrl}`;

    await sendEmail_to_invite(from, email, finalMessage);

    console.log(`Invitation sent to ${email} from ${from}`);

    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully",
    });

  } catch (error) {
    console.error("SEND INVITATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send invitation",
    });
  }
};
const User = require("../../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {generateProfileId} = require("../../utils/generateProfileId");
const { verificationCode } = require("../../utils/verificationCode");
const { sendEmail } = require("../../utils/sendEmail");


// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({success: false,message: "All fields are required",});
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({success: false,message: "User already exists",});
    }

  
  let profileId;
  let isUnique = false;
    while (!isUnique) {
    profileId = generateProfileId();
    const existing = await User.findOne({ profileId });
    if (!existing) isUnique = true;
  }
 

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({name,email,password: hashedPassword,profileId });

    res.status(201).json({
      success: true,message: "Registration successful",
      user: {id: user._id,name: user.name,email: user.email, profileId: user.profileId}
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({success: false,message: "Invalid email or password",});
    }

    if (user.status === "deactivated") {
      return res.status(403).json({success: false,message: "Account is deactivated",});
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({success: false,message: "Invalid email or password",});
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({success: true,message: "Login successful",token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ME
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({success: false,message: "User not found",});
    }
    res.status(200).json({success: true,user,});
  } catch (error) {
    res.status(500).json({success: false,message: error.message,});
  }
};


// LOGOUT
exports.logout = (req, res) => {
    res.json({
    success: true,
    message: "Logged out successfully",
  });
};



// FORGOT PASSWORD - STEP 1, SEND VERIFICATION CODE

exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({success: false,message: "Email is required",});
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({success: false,message: "No account found with this email",});
    }
    const code = verificationCode();
    user.verificationCode = code;
    user.verificationCodeExpires =Date.now() + 5 * 60 * 1000;
    await user.save();
    // Send code to email
    await sendEmail(user.email, code);
    res.status(200).json({success: true,message: "Verification code sent to your email",});
  } catch (error) {
    res.status(500).json({success: false, message: error.message, });
  }
};


// FORGOT PASSWORD - STEP 2, VERIFY CODE
exports.verifyCode = async (req, res) => {
  try {

    const { email, verifCode } = req.body;

    if (!email || !verifCode) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.verificationCode !== verifCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code verified successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// FORGOT PASSWORD - STEP 3,  RESET PASSWORD + AUTO LOGIN

exports.resetPassword = async (req, res) => {
  try {

    const { email,newPassword,verifCode } = req.body;
    if (!email || !newPassword || !verifCode) {
      return res.status(400).json({success: false, message: "Email, verification code and new password are required",});
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({success: false, message: "User not found", });
    }

    // Verify code again
    if (user.verificationCode !== verifCode) {
      return res.status(400).json({ success: false, message: "Invalid verification code",});
    }

    // Check expiry again
    if (!user.verificationCodeExpires ||  user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({success: false,message: "Verification code has expired",});
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword,10);

    user.password = hashedPassword;

    // Clear verification code after successful reset
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    // Automatically login user
    const token = jwt.sign({ userId: user._id },process.env.JWT_SECRET,{ expiresIn: "1d" });

    res.status(200).json({success: true,message: "Password reset successfully",
      token,user: { id: user._id,name: user.name,email: user.email,},
    });

  } catch (error) {
    res.status(500).json({success: false,message: error.message, });

  }
};


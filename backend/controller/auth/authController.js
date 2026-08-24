const User = require("../../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({name,email,password: hashedPassword,});

    res.status(201).json({
      success: true,message: "Registration successful",
      user: {id: user._id,name: user.name,email: user.email,}
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
    const user = await User.findOne({ email });

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
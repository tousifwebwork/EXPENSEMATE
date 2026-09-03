const User = require("../../model/userModel");
const bcrypt = require("bcryptjs");

const cloudinary = require("../../config/cloudinary"); 


// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, preferredCurrency, profileImage, about, address } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (preferredCurrency !== undefined) updates.preferredCurrency = preferredCurrency;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (about !== undefined) updates.about = about;

    if (address !== undefined) {
      const allowedFields = ["landmark", "state", "country"];
      updates.address = {};
      allowedFields.forEach((field) => {
        if (address[field] !== undefined) updates.address[field] = address[field];
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try { 
    const user = await User.findById(req.params.userId).select("-password" );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found",});
    }

    res.status(200).json({success: true,user,});
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

 
exports.updateProfileImage = async (req, res) => {
  try { 
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    } 

    const { path } = req.file;
 

    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: path },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
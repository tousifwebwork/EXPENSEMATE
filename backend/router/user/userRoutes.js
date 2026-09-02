const express = require("express");
const router = express.Router();    

const { protect  } = require("../../middleware/authMiddleware");
const upload = require("../../middleware/upload");
const {getProfile,updateProfile, getUserById,updateProfileImage} = require("../../controller/user/userController") 



router.get("/profile", protect,getProfile);
router.patch("/profile", protect, updateProfile); 
router.get("/individual/:userId", protect, getUserById);
router.patch("/profile/image",protect,upload.single("profileImage"),updateProfileImage);
module.exports = router;
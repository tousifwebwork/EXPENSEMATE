const express = require("express");
const router = express.Router();    

const { protect } = require("../../middleware/authMiddleware");
const {getProfile,updateProfile,changePassword} = require("../../controller/user/userController") 



router.get("/profile", protect,getProfile);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);

module.exports = router;
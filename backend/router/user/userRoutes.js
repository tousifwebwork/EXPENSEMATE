const express = require("express");
const router = express.Router();    

const { protect  } = require("../../middleware/authMiddleware");
const upload = require("../../middleware/upload");
const {getProfile,updateProfile, getUserById,updateProfileImage,deleteProfileImage} = require("../../controller/user/userController") 



router.get("/profile", protect,getProfile);
router.patch("/profile", protect, updateProfile); 
router.get("/individual/:userId", protect, getUserById);
// router.patch("/profile/image",protect,upload.single("profileImage"),updateProfileImage);

router.patch(
  "/profile/image",
  protect,
  (req, res, next) => {
    upload.single("profileImage")(req, res, (err) => {
      if (err) {
        console.log("UPLOAD ERROR:", err);
        return res.status(500).json({
          success: false,
          error: err,
        });
      }
      next();
    });
  },
  updateProfileImage
);

router.delete("/profile/image", protect, deleteProfileImage);

module.exports = router;
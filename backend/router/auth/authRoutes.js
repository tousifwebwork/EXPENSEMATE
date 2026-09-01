const express = require("express");

const {register,login,logout,getMe,verifyCode,sendVerificationCode,resetPassword} = require("../../controller/auth/authController");
const { protect } = require("../../middleware/authMiddleware");

const {registerValidation,loginValidation} = require("../../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", logout);

router.get("/me", protect, getMe);


// FORGOT PASSWORD
router.post("/forgot-password",sendVerificationCode);
// VERIFY FORGOT PASSWORD CODE
router.post( "/verify-code", verifyCode);
// RESET PASSWORD
router.post("/reset-password",resetPassword);

module.exports = router;
const express = require("express");

const {register,login,logout,getMe,} = require("../../controller/auth/authController");
const { protect } = require("../../middleware/authMiddleware");

const {registerValidation,loginValidation} = require("../../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
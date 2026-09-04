const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const dashboardController = require("../../controller/dashboard/dashboardController");

router.get("/", protect, dashboardController.getDashboard);

module.exports = router;
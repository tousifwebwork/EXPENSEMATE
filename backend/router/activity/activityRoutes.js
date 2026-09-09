const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const activityController = require("../../controller/activity/activityController");

router.get("/group/:groupId", protect, activityController.getGroupActivity);

module.exports = router;
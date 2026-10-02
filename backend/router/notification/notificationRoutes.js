const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const notificationController = require("../../controller/notification/notificationController");

router.get("/", protect, notificationController.getNotifications);
router.patch("/:notificationId/read", protect, notificationController.markAsRead);
router.patch("/read-all", protect, notificationController.markAllAsRead);

module.exports = router;



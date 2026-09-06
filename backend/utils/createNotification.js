const Notification = require("../model/notificationModel");

async function createNotification({ recipient, type, message, relatedGroup, relatedUser }) {
  try {
    await Notification.create({ recipient, type, message, relatedGroup, relatedUser });
  } catch (error) {
    // Don't let a notification failure break the main action (e.g., expense creation)
    console.log("Failed to create notification:", error.message);
  }
}

module.exports = createNotification;
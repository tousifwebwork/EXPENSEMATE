const Activity = require("../model/activityModel");

async function logActivity({ group, actor, action, description, metadata }) {
  try {
    await Activity.create({ group, actor, action, description, metadata });
  } catch (error) {
    console.log("Failed to log activity:", error.message);
  }
}

module.exports = logActivity;
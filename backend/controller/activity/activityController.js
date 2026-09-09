const Activity = require("../../model/activityModel");
const Group = require("../../model/groupModel");
const getGroupMembership = require("../../utils/getGroupMembership");

exports.getGroupActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const activities = await Activity.find({ group: groupId })
      .populate("actor", "name profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await Activity.countDocuments({ group: groupId });

    res.status(200).json({
      success: true,
      activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
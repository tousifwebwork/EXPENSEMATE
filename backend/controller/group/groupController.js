
const Group = require("../../model/groupModel");
const User = require("../../model/userModel");
const FriendRequest = require("../../model/friendRequestModel");
const mongoose = require("mongoose");
const createNotification = require("../../utils/createNotification");
const logActivity = require("../../utils/logActivity");


// ADD MEMBER
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    const { search } = req.body;
    const value = typeof search === "string" ? search.trim() : "";

    if (!value) {
      return res.status(400).json({
        success: false,
        message: "Name or Profile ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const membership = group.members.find(
      (m) => m.user.toString() === userId
    );

    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add members",
      });
    }

    // Profile IDs are stored uppercase; names are matched exactly, case-insensitively.
    const escapedName = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const newUser = await User.findOne({
      $or: [
        { profileId: value.toUpperCase() },
        { name: { $regex: `^${escapedName}$`, $options: "i" } },
      ],
    });

    if (!newUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const friendship = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: newUser._id },
        { sender: newUser._id, receiver: userId },
      ],
      status: "accepted",
    });

    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: "You can only add your friends to the group"
      });
    }

    const alreadyMember = group.members.some(
      (member) => member.user.toString() === newUser._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of the group",
      });
    }

    group.members.push({
      user: newUser._id,
      userName: newUser.name,
      role: "member"
    });

    await group.save();

    await createNotification({
      recipient: newUser._id,
      type: "group_invite",
      message: `You were added to the group "${group.name}"`,
      relatedGroup: group._id,
      relatedUser: userId
    });

    await logActivity({
      group: groupId,
      actor: userId,
      action: "member_added",
      description: `added ${newUser.name} to the group`
    });

    res.status(200).json({
      success: true,
      message: "Member added",
      group,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 








// CREATE GROUP
exports.createGroup = async (req, res) => {
  try {
    const { name, description, coverImage, baseCurrency } = req.body;
    const userId = req.user.userId; 
    const userModel = await User.findById(userId).select("name");
    const username = userModel.name;

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }
        console.log(username)


    const group = await Group.create({
      name,
      description,
      coverImage,
      baseCurrency,
      owner: userId,
      members: [{ user: userId,userName:username,role: "owner" }],
    }); 
    await logActivity({
  group: group._id,
  actor: userId,
  action: "group_created",
  description: `created the group "${name}"`,
}); 
    res.status(201).json({ success: true, message: "Group created", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({success: false,message: "Group not found"});
    }

    const membership = group.members.find((m) => m.user.toString() === userId);

    if (!membership ||(membership.role !== "owner" && membership.role !== "admin")) {
      return res.status(403).json({success: false,message: "Only owner or admin can delete the group"});
    }
    await Group.findByIdAndDelete(id);
    res.status(200).json({success: true,message: "Group deleted successfully"});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET MY GROUPS (active + archived)
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groups = await Group.find({ "members.user": userId })
      .populate("members.user", "name email profileImage")
      .populate("owner", "name email profileImage");

    res.status(200).json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE GROUP (with membership check)
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId)
      .populate("members.user", "name email profileImage")
      .populate("owner", "name email profileImage");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.user._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// UPDATE GROUP DETAILS (owner or admin only)
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    const { name, description, coverImage, baseCurrency } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const membership = group.members.find((m) => m.user.toString() === userId);
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this group" });
    }

    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (coverImage !== undefined) group.coverImage = coverImage;
    if (baseCurrency !== undefined) group.baseCurrency = baseCurrency;

    await group.save();

    res.status(200).json({ success: true, message: "Group updated", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};







// PROMOTE / DEMOTE MEMBER (owner only)
exports.updateMemberRole = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body; // "admin" or "member"
    const userId = req.user.userId;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (group.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the owner can change member roles" });
    }

    const member = group.members.find((m) => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found in this group" });
    }
    if (member.role === "owner") {
      return res.status(400).json({ success: false, message: "Cannot change the owner's role" });
    }

    member.role = role;
    await group.save();

    await logActivity({
  group: groupId,
  actor: userId,
  action: "member_role_changed",
  description: `changed a member's role to ${role}`,
  metadata: { newRole: role },
});

    res.status(200).json({ success: true, message: "Member role updated", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// REMOVE MEMBER (owner/admin only; preserves historical data since we only touch Group.members)
exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const requester = group.members.find((m) => m.user.toString() === userId);
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Not authorized to remove members" });
    }

    if (group.owner.toString() === memberId) {
      return res.status(400).json({ success: false, message: "Cannot remove the group owner" });
    }

    group.members = group.members.filter((m) => m.user.toString() !== memberId);
    await group.save();
    await logActivity({
  group: groupId,
  actor: userId,
  action: "member_removed",
  description: `removed a member from the group`,
});

    res.status(200).json({ success: true, message: "Member removed", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ARCHIVE / REOPEN GROUP (owner only)
exports.toggleArchive = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (group.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the owner can archive/reopen this group" });
    }

    group.isArchived = !group.isArchived;
    await group.save();

    res.status(200).json({
      success: true,
      message: group.isArchived ? "Group archived" : "Group reopened",
      group,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
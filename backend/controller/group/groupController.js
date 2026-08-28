
const Group = require("../../model/groupModel");
const User = require("../../model/userModel");


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
    console.log(group)
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



// ADD MEMBER (using their profileId — reusing your friend-code pattern!)
exports.addMember = async (req, res) => {
  try {
    const User = require("../../model/userModel");
    const { groupId } = req.params;
    const userId = req.user.userId;
    const { profileId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const membership = group.members.find((m) => m.user.toString() === userId);
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Not authorized to add members" });
    }

    const newUser = await User.findOne({ profileId: profileId?.toUpperCase() });
    if (!newUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const alreadyMember = group.members.some((m) => m.user.toString() === newUser._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: "User is already a member of the group" });
    }

    group.members.push({ user: newUser._id, userName: newUser.name, role: "member" });
    await group.save();

    res.status(200).json({ success: true, message: "Member added", group });
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
const Group = require("../../model/groupModel");
const getGroupMembership = require("../../utils/getGroupMembership");
const calculateGroupBalances = require("../../utils/calculateGroupBalances");
const simplifySettlements = require("../../utils/simplifySettlements");

// GET GROUP BALANCES
exports.getGroupBalances = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    console.log("JWT USER ID:", userId);

    const group = await Group.findById(groupId).populate("members.user", "name profileImage");
    console.log("Group owner:", group.owner);
    console.log("Group members:", group.members);
    
    if (!group) { 
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const balances = await calculateGroupBalances(group);

    res.status(200).json({ success: true, balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SETTLEMENT SUGGESTIONS
exports.getSettlementSuggestions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate("members.user", "name profileImage");
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const balances = await calculateGroupBalances(group);
    const suggestions = simplifySettlements(balances);

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
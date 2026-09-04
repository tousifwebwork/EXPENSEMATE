const Settlement = require("../../model/settlementModel");
const Group = require("../../model/groupModel");
const getGroupMembership = require("../../utils/getGroupMembership");
const calculateGroupBalances = require("../../utils/calculateGroupBalances");

// RECORD SETTLEMENT
exports.createSettlement = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId, payer, receiver, amount, note, date } = req.body;

    if (!groupId || !payer || !receiver || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Settlement amount must be greater than zero" });
    }
    if (payer === receiver) {
      return res.status(400).json({ success: false, message: "Payer and receiver cannot be the same person" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const memberIds = group.members.map((m) => m.user.toString());
    if (!memberIds.includes(payer) || !memberIds.includes(receiver)) {
      return res.status(400).json({ success: false, message: "Payer and receiver must be group members" });
    }

    const settlement = await Settlement.create({
      group: groupId,
      payer,
      receiver,
      amount,
      note,
      date,
      createdBy: userId,
    });

    res.status(201).json({ success: true, message: "Settlement recorded", settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SETTLEMENT HISTORY FOR A GROUP
exports.getGroupSettlements = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const settlements = await Settlement.find({ group: groupId })
      .populate("payer", "name profileImage")
      .populate("receiver", "name profileImage")
      .sort({ date: -1 });

    res.status(200).json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE SETTLEMENT (correct a mistake)
exports.updateSettlement = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { settlementId } = req.params;
    const { amount, note, date } = req.body;

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({ success: false, message: "Settlement not found" });
    }

    const group = await Group.findById(settlement.group);
    const requester = getGroupMembership(group, userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const isOwnSettlement = settlement.createdBy.toString() === userId;
    const isPrivileged = requester.role === "owner" || requester.role === "admin";
    if (!isOwnSettlement && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this settlement" });
    }

    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: "Settlement amount must be greater than zero" });
      }
      settlement.amount = amount;
    }
    if (note !== undefined) settlement.note = note;
    if (date !== undefined) settlement.date = date;

    await settlement.save();

    res.status(200).json({ success: true, message: "Settlement updated", settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE SETTLEMENT
exports.deleteSettlement = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { settlementId } = req.params;

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({ success: false, message: "Settlement not found" });
    }

    const group = await Group.findById(settlement.group);
    const requester = getGroupMembership(group, userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const isOwnSettlement = settlement.createdBy.toString() === userId;
    const isPrivileged = requester.role === "owner" || requester.role === "admin";
    if (!isOwnSettlement && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this settlement" });
    }

    await settlement.deleteOne();

    res.status(200).json({ success: true, message: "Settlement deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
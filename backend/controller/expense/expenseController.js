const Expense = require("../../model/expenseModel");
const Group = require("../../model/groupModel");
const getGroupMembership = require("../../utils/getGroupMembership");
const {
  calculateEqualSplit,
  validateExactSplit,
  calculatePercentageSplit,
} = require("../../utils/calculateSplit");

// CREATE EXPENSE
exports.createExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId, title, description, amount, currency, category, date, paidBy, splitType, shares, notes } = req.body;

    // Step 1: Required fields
    if (!groupId || !title || !amount || !paidBy || !splitType || !shares?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than zero" });
    }

    // Step 2: Group + membership check
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const requester = getGroupMembership(group, userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    // Step 3: Payer + participants must be group members
    const memberIds = group.members.map((m) => m.user.toString());
    if (!memberIds.includes(paidBy)) {
      return res.status(400).json({ success: false, message: "Payer must be a group member" });
    }
    const invalidParticipant = shares.find((s) => !memberIds.includes(s.user));
    if (invalidParticipant) {
      return res.status(400).json({ success: false, message: "All participants must be group members" });
    }

    // Step 4: Calculate/validate split based on type
    let finalShares;

    if (splitType === "equal") {
      const participantIds = shares.map((s) => s.user);
      finalShares = calculateEqualSplit(amount, participantIds);

    } else if (splitType === "exact") {
      const isValid = validateExactSplit(amount, shares);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Exact split amounts must add up to the total" });
      }
      finalShares = shares.map((s) => ({ user: s.user, amount: s.amount }));

    } else if (splitType === "percentage") {
      finalShares = calculatePercentageSplit(amount, shares);
      if (!finalShares) {
        return res.status(400).json({ success: false, message: "Percentages must add up to 100" });
      }

    } else {
      return res.status(400).json({ success: false, message: "Invalid split type" });
    }

    // Step 5: Save
    const expense = await Expense.create({
      group: groupId,
      title,
      description,
      amount,
      currency: currency || group.baseCurrency,
      category,
      date,
      paidBy,
      splitType,
      shares: finalShares,
      notes,
      createdBy: userId,
    });

    res.status(201).json({ success: true, message: "Expense added", expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL EXPENSES FOR A GROUP
exports.getGroupExpenses = async (req, res) => {
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

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name profileImage")
      .populate("shares.user", "name profileImage")
      .sort({ date: -1 });

    res.status(200).json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE EXPENSE
exports.getExpenseById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name profileImage")
      .populate("shares.user", "name profileImage");

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const group = await Group.findById(expense.group);
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    res.status(200).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE EXPENSE
exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;
    const { title, description, amount, category, date, paidBy, splitType, shares, notes } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const group = await Group.findById(expense.group);
    const requester = getGroupMembership(group, userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    // Permission: own expense = anyone can edit; someone else's = owner/admin only
    const isOwnExpense = expense.createdBy.toString() === userId;
    const isPrivileged = requester.role === "owner" || requester.role === "admin";
    if (!isOwnExpense && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this expense" });
    }

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than zero" });
    }

    // If amount, splitType, or shares changed — recalculate the split
    if (amount !== undefined || splitType !== undefined || shares !== undefined) {
      const finalAmount = amount !== undefined ? amount : expense.amount;
      const finalSplitType = splitType !== undefined ? splitType : expense.splitType;
      const finalRawShares = shares !== undefined ? shares : expense.shares;

      let finalShares;
      if (finalSplitType === "equal") {
        const participantIds = finalRawShares.map((s) => s.user);
        finalShares = calculateEqualSplit(finalAmount, participantIds);

      } else if (finalSplitType === "exact") {
        const isValid = validateExactSplit(finalAmount, finalRawShares);
        if (!isValid) {
          return res.status(400).json({ success: false, message: "Exact split amounts must add up to the total" });
        }
        finalShares = finalRawShares.map((s) => ({ user: s.user, amount: s.amount }));

      } else if (finalSplitType === "percentage") {
        finalShares = calculatePercentageSplit(finalAmount, finalRawShares);
        if (!finalShares) {
          return res.status(400).json({ success: false, message: "Percentages must add up to 100" });
        }
      } else {
        return res.status(400).json({ success: false, message: "Invalid split type" });
      }

      expense.amount = finalAmount;
      expense.splitType = finalSplitType;
      expense.shares = finalShares;
    }

    // Apply other simple fields
    if (title !== undefined) expense.title = title;
    if (description !== undefined) expense.description = description;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (paidBy !== undefined) expense.paidBy = paidBy;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    res.status(200).json({ success: true, message: "Expense updated", expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const group = await Group.findById(expense.group);
    const requester = getGroupMembership(group, userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const isOwnExpense = expense.createdBy.toString() === userId;
    const isPrivileged = requester.role === "owner" || requester.role === "admin";
    if (!isOwnExpense && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this expense" });
    }

    await expense.deleteOne();

    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
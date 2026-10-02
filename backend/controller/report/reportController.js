const Expense = require("../../model/expenseModel");
const Settlement = require("../../model/settlementModel");
const Group = require("../../model/groupModel");
const getGroupMembership = require("../../utils/getGroupMembership");
const { Parser } = require("json2csv");

// MONTHLY / CATEGORY / DATE-RANGE REPORT (combined — filters decide the shape)
exports.getExpenseReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { startDate, endDate, category } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const query = { group: groupId };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate("paidBy", "name")
      .populate("shares.user", "name")
      .sort({ date: -1 });

    // Category-wise breakdown
    const categoryBreakdown = {};
    expenses.forEach((exp) => {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    });

    // User contribution report (who paid how much overall)
    const userContribution = {};
    expenses.forEach((exp) => {
      const payerName = exp.paidBy.name;
      userContribution[payerName] = (userContribution[payerName] || 0) + exp.amount;
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({
      success: true,
      report: {
        totalExpenses: expenses.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        categoryBreakdown,
        userContribution,
        expenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SETTLEMENT REPORT
exports.getSettlementReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const query = { group: groupId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const settlements = await Settlement.find(query)
      .populate("payer", "name")
      .populate("receiver", "name")
      .sort({ date: -1 });

    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);

    res.status(200).json({
      success: true,
      report: {
        totalSettlements: settlements.length,
        totalSettled: Math.round(totalSettled * 100) / 100,
        settlements,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EXPORT EXPENSES AS CSV
exports.exportExpensesCSV = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { startDate, endDate, category } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const query = { group: groupId };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate("paidBy", "name")
      .sort({ date: -1 });

    // Flatten data for CSV (CSV can't handle nested objects/arrays well)
    
  const csvData = expenses.map((exp) => ({
  Title: exp.title,
  Amount: exp.amount,
  Currency: exp.currency,
  Category: exp.category,
  PaidBy: exp.paidBy?.name || "Unknown",
  SplitType: exp.splitType,
  Date: exp.date
    ? new Date(exp.date).toISOString().split("T")[0]
    : "",
}));

console.log("Expenses to be exported:", csvData);

const fields = [
  "Title",
  "Amount",
  "Currency",
  "Category",
  "PaidBy",
  "SplitType",
  "Date",
];

const parser = new Parser({ fields });
const csv = parser.parse(csvData);

res.header("Content-Type", "text/csv");
res.attachment(`expenses-${group.name}-${Date.now()}.csv`);
res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
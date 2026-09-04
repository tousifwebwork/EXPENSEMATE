const Group = require("../../model/groupModel");
const Expense = require("../../model/expenseModel");
const Settlement = require("../../model/settlementModel");
const calculateGroupBalances = require("../../utils/calculateGroupBalances");

// GET USER'S DASHBOARD SUMMARY
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Step 1: Find all groups this user belongs to
    const groups = await Group.find({ "members.user": userId, isArchived: false })
      .populate("members.user", "name profileImage");

    const groupIds = groups.map((g) => g._id);

    // Step 2: Get all expenses across these groups
    const allExpenses = await Expense.find({ group: { $in: groupIds } })
      .populate("paidBy", "name profileImage")
      .populate("shares.user", "name profileImage")
      .populate("group", "name baseCurrency")
      .sort({ date: -1 });

    // Step 3: Get all settlements across these groups
    const allSettlements = await Settlement.find({ group: { $in: groupIds } })
      .populate("payer", "name profileImage")
      .populate("receiver", "name profileImage")
      .populate("group", "name baseCurrency")
      .sort({ date: -1 });

    // Step 4: Calculate balances per group, then sum up what THIS user owes/is owed overall
    let totalOwed = 0;      // money the user owes others
    let totalReceivable = 0; // money others owe the user

    for (const group of groups) {
      const balances = await calculateGroupBalances(group);
      const myBalance = balances.find((b) => b.user._id.toString() === userId);

      if (myBalance) {
        if (myBalance.balance < 0) totalOwed += Math.abs(myBalance.balance);
        if (myBalance.balance > 0) totalReceivable += myBalance.balance;
      }
    }

    // Step 5: Current month expenses (only expenses where this user participated)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const myExpenses = allExpenses.filter((exp) =>
      exp.shares.some((s) => (s.user._id ? s.user._id.toString() : s.user.toString()) === userId) ||
      (exp.paidBy._id ? exp.paidBy._id.toString() : exp.paidBy.toString()) === userId
    );

    const currentMonthExpenses = myExpenses.filter((exp) => new Date(exp.date) >= startOfMonth);
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => {
      const myShare = exp.shares.find(
        (s) => (s.user._id ? s.user._id.toString() : s.user.toString()) === userId
      );
      return sum + (myShare ? myShare.amount : 0);
    }, 0);

    // Step 6: Category-wise spending (based on user's own share, not full expense amount)
    const categoryTotals = {};
    myExpenses.forEach((exp) => {
      const myShare = exp.shares.find(
        (s) => (s.user._id ? s.user._id.toString() : s.user.toString()) === userId
      );
      if (myShare) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + myShare.amount;
      }
    });

    // Step 7: Recent activity (last 5 expenses + settlements combined, sorted by date)
    const recentExpenses = allExpenses.slice(0, 5).map((e) => ({ type: "expense", data: e }));
    const recentSettlements = allSettlements.slice(0, 5).map((s) => ({ type: "settlement", data: s }));
    const recentActivity = [...recentExpenses, ...recentSettlements]
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
      .slice(0, 5);

    // Step 8: Groups with highest outstanding balances (for this user)
    const groupBalanceSummaries = [];
    for (const group of groups) {
      const balances = await calculateGroupBalances(group);
      const myBalance = balances.find((b) => b.user._id.toString() === userId);
      if (myBalance && Math.abs(myBalance.balance) > 0.01) {
        groupBalanceSummaries.push({
          groupId: group._id,
          groupName: group.name,
          balance: myBalance.balance,
        });
      }
    }
    groupBalanceSummaries.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    res.status(200).json({
      success: true,
      dashboard: {
        activeGroupsCount: groups.length,
        totalOwed: Math.round(totalOwed * 100) / 100,
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
        categoryTotals,
        recentActivity,
        groupsWithOutstandingBalance: groupBalanceSummaries.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
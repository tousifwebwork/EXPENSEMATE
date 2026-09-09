const Group = require('../models/Group');
const Expense = require('../models/Expense');

async function getSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const groupFilter = req.user.platformRole === 'platformAdmin' ? {} : { members: req.user._id };
    const groups = await Group.find(groupFilter).select('_id name baseCurrency');
    const groupIds = groups.map((group) => group._id);
    const expenseFilter = { group: { $in: groupIds } };
    if (startDate || endDate) {
      expenseFilter.date = {};
      if (startDate) expenseFilter.date.$gte = new Date(startDate);
      if (endDate) expenseFilter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(expenseFilter)
      .populate('group', 'name baseCurrency')
      .populate('payer', 'name email')
      .sort({ date: -1 });
    const categoryTotals = {};
    const groupTotals = {};
    const monthlyTotals = {};
    let total = 0;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount || 0);
      const category = expense.category || 'Other';
      const groupName = expense.group?.name || 'Unknown group';
      const month = new Date(expense.date).toISOString().slice(0, 7);
      total += amount;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      groupTotals[groupName] = (groupTotals[groupName] || 0) + amount;
      monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
    });

    return res.json({
      success: true,
      total: Number(total.toFixed(2)),
      expenseCount: expenses.length,
      categoryTotals,
      groupTotals,
      monthlyTotals,
      expenses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
}

module.exports = { getSummary };

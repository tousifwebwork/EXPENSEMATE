const Expense = require("../model/expenseModel");

// Calculates each member's net balance, total paid, and total spent for a group
async function calculateGroupBalances(group) {
  const balances = {};

  // Seed with current group members
  group.members.forEach((member) => {
    const userId = member.user._id
      ? member.user._id.toString()
      : member.user.toString();

    balances[userId] = {
      user: member.user,
      balance: 0,
      totalPaid: 0,
      totalSpent: 0,
    };
  });

  const expenses = await Expense.find({ group: group._id })
    .populate("paidBy", "name profileImage")
    .populate("shares.user", "name profileImage");

  expenses.forEach((expense) => {
    const payerId = expense.paidBy._id
      ? expense.paidBy._id.toString()
      : expense.paidBy.toString();

    if (!balances[payerId]) {
      balances[payerId] = {
        user: expense.paidBy,
        balance: 0,
        totalPaid: 0,
        totalSpent: 0,
      };
    }
    balances[payerId].balance += expense.amount;
    balances[payerId].totalPaid += expense.amount;

    expense.shares.forEach((share) => {
      const userId = share.user._id
        ? share.user._id.toString()
        : share.user.toString();

      if (!balances[userId]) {
        balances[userId] = {
          user: share.user,
          balance: 0,
          totalPaid: 0,
          totalSpent: 0,
        };
      }
      balances[userId].balance -= share.amount;
      balances[userId].totalSpent += share.amount;
    });
  });

  // Round to 2 decimals to avoid floating point noise (e.g. 666.6699999)
  return Object.values(balances).map((b) => ({
    ...b,
    balance: Math.round(b.balance * 100) / 100,
    totalPaid: Math.round(b.totalPaid * 100) / 100,
    totalSpent: Math.round(b.totalSpent * 100) / 100,
  }));
}

module.exports = calculateGroupBalances;
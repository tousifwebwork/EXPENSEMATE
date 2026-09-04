const Expense = require("../model/expenseModel");
const Settlement = require("../model/settlementModel"); // ✅ new import

async function calculateGroupBalances(group) {
  const balances = {};

  group.members.forEach((member) => {
    const userId = member.user._id ? member.user._id.toString() : member.user.toString();
    balances[userId] = { user: member.user, balance: 0, totalPaid: 0, totalSpent: 0 };
  });

  // ---- EXPENSES (unchanged) ----
  const expenses = await Expense.find({ group: group._id })
    .populate("paidBy", "name profileImage")
    .populate("shares.user", "name profileImage");

  expenses.forEach((expense) => {
    const payerId = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
    if (!balances[payerId]) {
      balances[payerId] = { user: expense.paidBy, balance: 0, totalPaid: 0, totalSpent: 0 };
    }
    balances[payerId].balance += expense.amount;
    balances[payerId].totalPaid += expense.amount;

    expense.shares.forEach((share) => {
      const userId = share.user._id ? share.user._id.toString() : share.user.toString();
      if (!balances[userId]) {
        balances[userId] = { user: share.user, balance: 0, totalPaid: 0, totalSpent: 0 };
      }
      balances[userId].balance -= share.amount;
      balances[userId].totalSpent += share.amount;
    });
  });

  // ---- SETTLEMENTS (new) ----
  const settlements = await Settlement.find({ group: group._id })
    .populate("payer", "name profileImage")
    .populate("receiver", "name profileImage");

  settlements.forEach((settlement) => {
    const payerId = settlement.payer._id.toString();
    const receiverId = settlement.receiver._id.toString();

    // Payer already owed money (negative balance) — paying reduces that debt (moves toward 0, i.e., increases)
    if (!balances[payerId]) {
      balances[payerId] = { user: settlement.payer, balance: 0, totalPaid: 0, totalSpent: 0 };
    }
    balances[payerId].balance += settlement.amount;

    // Receiver was owed money (positive balance) — receiving payment reduces that credit (moves toward 0, i.e., decreases)
    if (!balances[receiverId]) {
      balances[receiverId] = { user: settlement.receiver, balance: 0, totalPaid: 0, totalSpent: 0 };
    }
    balances[receiverId].balance -= settlement.amount;
  });

  return Object.values(balances).map((b) => ({
    ...b,
    balance: Math.round(b.balance * 100) / 100,
    totalPaid: Math.round(b.totalPaid * 100) / 100,
    totalSpent: Math.round(b.totalSpent * 100) / 100,
  }));
}

module.exports = calculateGroupBalances;
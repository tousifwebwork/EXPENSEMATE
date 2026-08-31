// Given balances, suggest minimum transactions to settle everyone up
function simplifySettlements(balances) {
  // Separate into creditors (owed money) and debtors (owe money)
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ userId: b.user._id.toString(), name: b.user.name, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ userId: b.user._id.toString(), name: b.user.name, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const suggestions = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    suggestions.push({
      from: debtor.userId,
      fromName: debtor.name,
      to: creditor.userId,
      toName: creditor.name,
      amount: Math.round(settleAmount * 100) / 100,
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return suggestions;
}

module.exports = simplifySettlements;
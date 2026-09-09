function toCents(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return NaN;
  return Math.round(numericValue * 100);
}

function fromCents(value) {
  return Number((value / 100).toFixed(2));
}

function getUserShareMap(participants, splitType, amount, sharesInput = []) {
  const userIds = participants.map((user) => (user.user || user).toString());
  const amountCents = toCents(amount);

  if (!userIds.length || !Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Expense amount must be greater than zero');
  }

  if (new Set(userIds).size !== userIds.length) {
    throw new Error('Each participant can only be selected once');
  }

  if (splitType === 'equal') {
    const share = Math.floor(amountCents / userIds.length);
    const remainder = amountCents - share * userIds.length;

    return userIds.reduce((result, userId, index) => {
      const value = index === userIds.length - 1 ? share + remainder : share;
      result[userId] = fromCents(value);
      return result;
    }, {});
  }

  if (splitType === 'exact') {
    const exactMap = {};
    const participantSet = new Set(userIds);
    const shareUsers = sharesInput.map((share) => String(share.user));
    const totalCents = sharesInput.reduce((sum, share) => sum + toCents(share.amount || 0), 0);

    if (shareUsers.length !== userIds.length || new Set(shareUsers).size !== shareUsers.length || shareUsers.some((id) => !participantSet.has(id))) {
      throw new Error('Exact split must include one amount for every participant');
    }

    sharesInput.forEach((share) => {
      const amountInCents = toCents(share.amount || 0);
      if (!Number.isInteger(amountInCents) || amountInCents < 0) {
        throw new Error('Exact split amounts must be valid positive values');
      }
      exactMap[String(share.user)] = fromCents(amountInCents);
    });

    if (totalCents !== amountCents) {
      throw new Error('Exact split amounts must equal the expense total');
    }

    return exactMap;
  }

  if (splitType === 'percentage') {
    const percentageMap = {};
    const participantSet = new Set(userIds);
    const shareUsers = sharesInput.map((share) => String(share.user));
    const totalPercent = sharesInput.reduce((sum, share) => sum + Number(share.amount || 0), 0);

    if (shareUsers.length !== userIds.length || new Set(shareUsers).size !== shareUsers.length || shareUsers.some((id) => !participantSet.has(id))) {
      throw new Error('Percentage split must include one percentage for every participant');
    }
    if (!Number.isFinite(totalPercent) || Math.abs(totalPercent - 100) > 0.000001 || sharesInput.some((share) => !Number.isFinite(Number(share.amount)) || Number(share.amount) < 0)) {
      throw new Error('Percentage split must total 100%');
    }

    const allocations = sharesInput.map((share) => {
      const rawCents = amountCents * (Number(share.amount || 0) / 100);
      const baseCents = Math.floor(rawCents);
      return { user: String(share.user), cents: baseCents, remainder: rawCents - baseCents };
    });
    let remainingCents = amountCents - allocations.reduce((sum, allocation) => sum + allocation.cents, 0);
    allocations.sort((left, right) => right.remainder - left.remainder);
    for (let index = 0; index < allocations.length && remainingCents > 0; index += 1, remainingCents -= 1) {
      allocations[index].cents += 1;
    }
    allocations.forEach((allocation) => {
      percentageMap[allocation.user] = fromCents(allocation.cents);
    });

    return percentageMap;
  }

  return {};
}

function calculateGroupBalances(groupMembers, expenses, settlements = []) {
  const totals = {};
  groupMembers.forEach((member) => {
    const userId = String(member._id || member);
    totals[userId] = {
      paid: 0,
      shareOwed: 0,
      receivable: 0,
      payable: 0,
      net: 0,
    };
  });

  expenses.forEach((expense) => {
    const payerId = String(expense.payer);
    const participantIds = expense.participants.map((member) => String(member));

    if (!totals[payerId]) {
      totals[payerId] = { paid: 0, shareOwed: 0, receivable: 0, payable: 0, net: 0 };
    }

    totals[payerId].paid += toCents(expense.amount || 0);

    participantIds.forEach((participantId) => {
      if (!totals[participantId]) {
        totals[participantId] = { paid: 0, shareOwed: 0, receivable: 0, payable: 0, net: 0 };
      }

      const shareValue = expense.shares?.find((share) => String(share.user) === participantId)?.amount || 0;
      totals[participantId].shareOwed += toCents(shareValue || 0);
    });
  });

  settlements.forEach((settlement) => {
    const payerId = String(settlement.payer);
    const receiverId = String(settlement.receiver);
    if (!totals[payerId]) totals[payerId] = { paid: 0, shareOwed: 0, receivable: 0, payable: 0, net: 0 };
    if (!totals[receiverId]) totals[receiverId] = { paid: 0, shareOwed: 0, receivable: 0, payable: 0, net: 0 };

    // A settlement payment reduces what the payer still owes (or increases what
    // they're owed if they overpay), and reduces what the receiver is still owed.
    totals[payerId].payable += toCents(settlement.amount || 0);
    totals[receiverId].receivable += toCents(settlement.amount || 0);
  });

  const balances = {};
  Object.keys(totals).forEach((userId) => {
    const row = totals[userId];
    // net = amount they should receive minus amount they owe from expenses,
    // adjusted by settlements already exchanged: money the user paid out via
    // settlement (payable) closes their debt (+), money the user received via
    // settlement (receivable) closes what they were owed (-).
    const netCents = row.paid - row.shareOwed + row.payable - row.receivable;
    const net = fromCents(netCents);
    balances[userId] = {
      paid: fromCents(row.paid),
      shareOwed: fromCents(row.shareOwed),
      receivable: fromCents(row.receivable),
      payable: fromCents(row.payable),
      net,
      label: net > 0 ? 'should_receive' : net < 0 ? 'owes' : 'settled',
    };
  });

  return balances;
}

function simplifySettlementSuggestions(balances) {
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([userId, balance]) => {
    const net = toCents(balance.net || 0);
    if (net < 0) {
      debtors.push({ userId, amount: Math.abs(net) });
    }
    if (net > 0) {
      creditors.push({ userId, amount: net });
    }
  });

  const suggestions = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    if (debtor.amount <= 0) {
      debtorIndex += 1;
      continue;
    }
    if (creditor.amount <= 0) {
      creditorIndex += 1;
      continue;
    }

    const amount = Math.min(debtor.amount, creditor.amount);
    suggestions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: fromCents(amount),
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  return suggestions;
}

module.exports = {
  getUserShareMap,
  calculateGroupBalances,
  simplifySettlementSuggestions,
};

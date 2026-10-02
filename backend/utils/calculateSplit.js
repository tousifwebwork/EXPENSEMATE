// Convert to paise (integer) to avoid floating-point rounding bugs
function toPaise(amount) {
  return Math.round(amount * 100);
}
function toRupees(paise) {
  return paise / 100;
}

// EQUAL SPLIT
function calculateEqualSplit(totalAmount, participantIds) {
  const totalPaise = toPaise(totalAmount);
  const n = participantIds.length;
  const basePaise = Math.floor(totalPaise / n);
  const remainder = totalPaise - basePaise * n;

  return participantIds.map((userId, index) => {
    const extra = index < remainder ? 1 : 0; // spread leftover paise, 1 each
    return { user: userId, amount: toRupees(basePaise + extra) };
  });
}

// EXACT SPLIT — just validate creator's amounts sum correctly
function validateExactSplit(totalAmount, shares) {
  const totalPaise = toPaise(totalAmount);
  const sumPaise = shares.reduce((sum, s) => sum + toPaise(s.amount), 0);
  return sumPaise === totalPaise;
}

// PERCENTAGE SPLIT
function calculatePercentageSplit(totalAmount, shares) {
  const totalPercentage = shares.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.round(totalPercentage * 100) / 100 !== 100) {
    return null; // invalid — must total 100
  }

  const totalPaise = toPaise(totalAmount);
  let allocatedPaise = 0;

  return shares.map((s, index) => {
    let sharePaise;
    if (index === shares.length - 1) {
      sharePaise = totalPaise - allocatedPaise; // last person absorbs rounding diff
    } else {
      sharePaise = Math.round((totalPaise * s.percentage) / 100);
      allocatedPaise += sharePaise;
    }
    return { user: s.user, amount: toRupees(sharePaise), percentage: s.percentage };
  });
}

module.exports = { calculateEqualSplit, validateExactSplit, calculatePercentageSplit };
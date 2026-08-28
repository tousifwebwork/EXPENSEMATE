// Placeholder data so the app has something to show before a real
// backend exists. Dashboard.jsx reads summary/recentExpenses/
// recentSettlements directly; storage.js uses recentExpenses and
// recentSettlements as the starting point for localStorage.

export const summary = {
  totalBalance: 12500,
  youOwe: -2500,
  youAreOwed: 5000,
}

export const recentExpenses = [
  {
    id: 1,
    icon: '🍔',
    title: 'Dinner',
    group: 'Friends',
    date: 'Today',
    yourShare: -450,
  },
  {
    id: 2,
    icon: '🚕',
    title: 'Uber Ride',
    group: 'Trip',
    date: 'Yesterday',
    yourShare: -280,
  },
  {
    id: 3,
    icon: '🏨',
    title: 'Hotel',
    group: 'Goa Trip',
    date: '20 Aug 2026',
    yourShare: 1200,
  },
  {
    id: 4,
    icon: '🛒',
    title: 'Groceries',
    group: 'Home',
    date: '19 Aug 2026',
    yourShare: -650,
  },
]

export const recentSettlements = [
  {
    id: 1,
    icon: '🤝',
    title: 'Settlement with Rahul',
    group: 'Friends',
    date: 'Today',
    amount: 1000,
    status: 'pending',
  },
  {
    id: 2,
    icon: '🤝',
    title: 'Settlement with Priya',
    group: 'Goa Trip',
    date: '18 Aug 2026',
    amount: 750,
    status: 'pending',
  },
  {
    id: 3,
    icon: '🤝',
    title: 'Settlement with Amit',
    group: 'College',
    date: '15 Aug 2026',
    amount: 500,
    status: 'pending',
  },
]
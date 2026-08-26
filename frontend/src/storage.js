// Small localStorage helpers for groups/expenses/settlements, so data
// the user adds in the app survives a page refresh. The first time
// each key is read, it falls back to the sample data in mockData.js.
import { recentExpenses, recentSettlements } from './mockData.js'

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export const getExpenses = () => read('expensemate-expenses', recentExpenses)
export const saveExpenses = (expenses) => localStorage.setItem('expensemate-expenses', JSON.stringify(expenses))
export const getSettlements = () => read('expensemate-settlements', recentSettlements)
export const saveSettlements = (settlements) => localStorage.setItem('expensemate-settlements', JSON.stringify(settlements))

const defaultGroups = [
  { name: 'Friends', members: 6, balance: '₹1,250 owed to you', color: 'bg-[#e6f8f4] text-[#117d72]' },
  { name: 'Goa Trip', members: 4, balance: 'You owe ₹2,500', color: 'bg-[#fff6ed] text-[#b6631e]' },
  { name: 'Home', members: 3, balance: 'Settled up', color: 'bg-[#eef5ff] text-[#3569a8]' },
  { name: 'College', members: 8, balance: '₹500 owed to you', color: 'bg-[#f5efff] text-[#7651a8]' },
]

export const getGroups = () => read('expensemate-groups', defaultGroups)
export const saveGroups = (groups) => localStorage.setItem('expensemate-groups', JSON.stringify(groups))

export const getAuditLog = () => read('expensemate-audit-log', [])
export const saveAuditLog = (entries) => localStorage.setItem('expensemate-audit-log', JSON.stringify(entries))

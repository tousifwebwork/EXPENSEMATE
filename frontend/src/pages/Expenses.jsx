import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import { recentExpenses } from '../mockData.js'

const formatINR = (amount) => `${amount < 0 ? '-' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}`

function Expenses() {
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Friends', 'Trip', 'Goa Trip', 'Home']
  const visibleExpenses = filter === 'All' ? recentExpenses : recentExpenses.filter((expense) => expense.group === filter)

  return (
    <AppLayout>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Activity</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Expenses</h1>
          <p className="mt-2 text-sm text-slate-500">Review your share of every group expense.</p>
        </div>
        <button className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 hover:bg-[#117d72]">+ Add Expense</button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${filter === item ? 'bg-[#102a43] text-white' : 'bg-white text-slate-500 hover:text-[#102a43]'}`} key={item} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visibleExpenses.length ? visibleExpenses.map((expense) => (
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 last:border-0" key={expense.id}>
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl">{expense.icon}</div>
              <div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#172033]">{expense.title}</h2><p className="mt-1 text-xs text-slate-500">{expense.group} · {expense.date}</p></div>
            </div>
            <div className={`shrink-0 text-sm font-bold ${expense.yourShare >= 0 ? 'text-[#117d72]' : 'text-[#b6631e]'}`}>{formatINR(expense.yourShare)}</div>
          </div>
        )) : <p className="px-5 py-12 text-center text-sm text-slate-500">No expenses in this group yet.</p>}
      </section>
    </AppLayout>
  )
}

export default Expenses

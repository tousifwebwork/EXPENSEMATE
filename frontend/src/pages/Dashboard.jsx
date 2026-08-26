// The landing page after login: quick totals, a small spending chart,
// and previews of recent expenses/settlements. All the numbers here
// come from mockData.js — swap that for a real API call later.
import AppLayout from '../components/AppLayout.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { summary, recentExpenses, recentSettlements } from '../mockData.js'
import { getProfile } from '../auth.js'

// Turns -450 into "-₹450" and 1200 into "₹1,200" (Indian digit grouping).
const formatINR = (amount) => {
  const sign = amount < 0 ? '-' : ''
  return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`
}

function Dashboard() {
  const profile = getProfile()
  const firstName = profile.name.split(' ')[0]
  const navigate = useNavigate()
  const expenseTotal = recentExpenses.reduce((total, expense) => total + Math.abs(expense.yourShare), 0)
  const largestExpense = recentExpenses.reduce((largest, expense) => Math.max(largest, Math.abs(expense.yourShare)), 0)

  return (
    <AppLayout>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Overview</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#102a43] sm:text-4xl">Welcome back, {firstName} 👋</h1>
            <p className="mt-2 text-sm text-slate-500">Here's what's happening with your expenses today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#102a43] shadow-sm transition hover:border-[#159a8c] hover:text-[#117d72]" onClick={() => navigate('/expenses')}>+ Add Expense</button>
            <button className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72]" onClick={() => navigate('/groups')}>+ Create Group</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#bfe8e2] bg-[#e6f8f4] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#117d72]">
              <span>💰</span> Total Balance
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight text-[#102a43]">{formatINR(summary.totalBalance)}</div>
          </div>

          <div className="rounded-2xl border border-[#f5dcc2] bg-[#fff6ed] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#b6631e]">
              <span>⬆️</span> You Owe
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight text-[#102a43]">{formatINR(summary.youOwe)}</div>
          </div>

          <div className="rounded-2xl border border-[#cbdcf3] bg-[#eef5ff] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#3569a8]">
              <span>⬇️</span> You Are Owed
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight text-[#102a43]">{formatINR(summary.youAreOwed)}</div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl bg-[#102a43] text-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7dd8ca]">Spending pulse</p>
              <h2 className="mt-2 text-xl font-bold">Your share this month</h2>
              <p className="mt-1 text-sm text-slate-300">Across {recentExpenses.length} recent expenses</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-3xl font-bold">{formatINR(expenseTotal)}</div>
              <div className="mt-1 text-xs font-semibold text-[#7dd8ca]">Largest share {formatINR(largestExpense)}</div>
            </div>
          </div>
          <div className="flex h-20 items-end gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-6">
            {recentExpenses.map((expense) => (
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={expense.id}>
                <div className="w-full rounded-t-md bg-[#47c5b0]" style={{ height: `${Math.max(22, (Math.abs(expense.yourShare) / largestExpense) * 100)}%` }} />
                <span className="truncate text-[10px] font-semibold text-slate-400">{expense.group}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-[#102a43]">Recent Expenses</h2>
              <Link className="text-sm font-bold text-[#117d72] hover:text-[#102a43]" to="/expenses">
                View All
              </Link>
            </div>
            {recentExpenses.map((expense) => (
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-0" key={expense.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">{expense.icon}</div>
                  <div>
                    <div className="truncate text-sm font-bold text-[#172033]">{expense.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {expense.group} · {expense.date}
                    </div>
                  </div>
                </div>
                <div
                  className={`shrink-0 text-sm font-bold ${
                    expense.yourShare >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {formatINR(expense.yourShare)}
                </div>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-[#102a43]">Recent Settlements</h2>
              <Link className="text-sm font-bold text-[#117d72] hover:text-[#102a43]" to="/settlements">
                View All
              </Link>
            </div>
            {recentSettlements.map((settlement) => (
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-0" key={settlement.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">🤝</div>
                  <div>
                    <div className="text-sm font-bold text-[#172033]">{settlement.title}</div>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${settlement.status === 'settled' ? 'bg-[#e6f8f4] text-[#117d72]' : 'bg-[#fff6ed] text-[#b6631e]'}`}>
                      {settlement.status === 'settled' ? 'Settled' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-sm font-bold text-[#117d72]">{formatINR(settlement.amount)}</div>
              </div>
            ))}
          </section>
        </div>
    </AppLayout>
  )
}

export default Dashboard

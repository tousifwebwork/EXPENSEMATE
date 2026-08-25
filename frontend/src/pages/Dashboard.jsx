import AppLayout from '../components/AppLayout.jsx'
import { currentUser, summary, recentExpenses, recentSettlements } from '../mockData.js'

const formatINR = (amount) => {
  const sign = amount < 0 ? '-' : ''
  return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`
}

function Dashboard() {
  const firstName = currentUser.name.split(' ')[0]

  return (
    <AppLayout>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Overview</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#102a43] sm:text-4xl">Welcome back, {firstName} 👋</h1>
            <p className="mt-2 text-sm text-slate-500">Here's what's happening with your expenses today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#102a43] shadow-sm transition hover:border-[#159a8c] hover:text-[#117d72]">+ Add Expense</button>
            <button className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72]">+ Create Group</button>
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

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-[#102a43]">Recent Expenses</h2>
              <a className="text-sm font-bold text-[#117d72] hover:text-[#102a43]" href="#expenses">
                View All
              </a>
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
              <a className="text-sm font-bold text-[#117d72] hover:text-[#102a43]" href="#settlements">
                View All
              </a>
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

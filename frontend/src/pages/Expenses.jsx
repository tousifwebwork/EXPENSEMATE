// Shows every expense, lets the user filter by group, and add a new one.
// "Your share" is positive when someone owes you and negative when you
// owe them — see the "Balance" dropdown in the add-expense form below.
import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import { getExpenses, saveExpenses } from '../storage.js'

const formatINR = (amount) => `${amount < 0 ? '-' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}`

function Expenses() {
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [expenses, setExpenses] = useState(getExpenses)
  const [form, setForm] = useState({ title: '', amount: '', group: 'Friends', direction: 'owe' })
  const filters = ['All', 'Friends', 'Trip', 'Goa Trip', 'Home']
  const visibleExpenses = filter === 'All' ? expenses : expenses.filter((expense) => expense.group === filter)

  const updateForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const addExpense = (event) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.title.trim() || !amount || amount < 1) return

    const nextExpenses = [
      {
        id: Date.now(),
        icon: form.direction === 'owe' ? '🧾' : '💸',
        title: form.title.trim(),
        group: form.group,
        date: 'Just now',
        yourShare: form.direction === 'owe' ? -amount : amount,
      },
      ...expenses,
    ]
    setExpenses(nextExpenses)
    saveExpenses(nextExpenses)
    setForm({ title: '', amount: '', group: 'Friends', direction: 'owe' })
    setShowForm(false)
  }

  return (
    <AppLayout>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Activity</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Expenses</h1>
          <p className="mt-2 text-sm text-slate-500">Review your share of every group expense.</p>
        </div>
        <button className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 hover:bg-[#117d72]" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ Add Expense'}</button>
      </div>

      {showForm && (
        <form className="mt-6 rounded-2xl border border-[#bfe8e2] bg-[#e6f8f4] p-5 sm:p-6" onSubmit={addExpense}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1fr_auto] lg:items-end">
            <label className="text-sm font-semibold text-slate-700">What was it?<input className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" name="title" placeholder="e.g. Dinner" value={form.title} onChange={updateForm} required /></label>
            <label className="text-sm font-semibold text-slate-700">Your share<input className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" name="amount" min="1" placeholder="450" type="number" value={form.amount} onChange={updateForm} required /></label>
            <label className="text-sm font-semibold text-slate-700">Group<select className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" name="group" value={form.group} onChange={updateForm}><option>Friends</option><option>Trip</option><option>Goa Trip</option><option>Home</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Balance<select className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" name="direction" value={form.direction} onChange={updateForm}><option value="owe">I owe</option><option value="owed">I am owed</option></select></label>
            <button className="rounded-xl bg-[#102a43] px-5 py-3 text-sm font-bold text-white hover:bg-[#173c5c]" type="submit">Add expense</button>
          </div>
        </form>
      )}

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

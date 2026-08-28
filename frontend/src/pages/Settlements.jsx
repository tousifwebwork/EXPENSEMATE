// Shows who owes whom and lets the user mark a settlement as paid.
// "Mark settled" just flips a status flag in localStorage — there's
// no real money movement here, it's a demo of the UI flow.
import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import { getSettlements, saveSettlements } from '../storage.js'

const formatINR = (amount) => `₹${amount.toLocaleString('en-IN')}`

function Settlements() {
  const [settlements, setSettlements] = useState(getSettlements)
  const pendingTotal = settlements.filter((settlement) => settlement.status !== 'settled').reduce((total, settlement) => total + settlement.amount, 0)

  return (
    <AppLayout>
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Balances</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Settlements</h1>
        <p className="mt-2 text-sm text-slate-500">Close the loop on money moving between friends.</p>
      </div>

      <section className="mt-8 rounded-2xl border border-[#bfe8e2] bg-[#e6f8f4] p-5 sm:p-6">
        <p className="text-sm font-semibold text-[#117d72]">Outstanding balance</p>
        <p className="mt-2 text-3xl font-bold text-[#102a43]">{formatINR(pendingTotal)}</p>
        <p className="mt-1 text-sm text-slate-600">Across {settlements.filter((settlement) => settlement.status !== 'settled').length} pending settlements</p>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {settlements.map((settlement) => {
          const isSettled = settlement.status === 'settled'
          return <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between" key={settlement.id}>
            <div className="flex items-center gap-4"><div className="grid size-11 place-items-center rounded-xl bg-slate-100 text-xl">🤝</div><div><h2 className="text-sm font-bold text-[#172033]">{settlement.title}</h2><p className="mt-1 text-xs text-slate-500">{settlement.group} · {settlement.date}</p></div></div>
              <div className="flex items-center justify-between gap-5 sm:justify-end"><span className="text-sm font-bold text-[#117d72]">{formatINR(settlement.amount)}</span><button className={`rounded-xl px-4 py-2 text-sm font-bold ${isSettled ? 'bg-slate-100 text-slate-400' : 'bg-[#102a43] text-white hover:bg-[#173c5c]'}`} disabled={isSettled} onClick={() => { const nextSettlements = settlements.map((item) => item.id === settlement.id ? { ...item, status: 'settled' } : item); setSettlements(nextSettlements); saveSettlements(nextSettlements) }}>{isSettled ? 'Settled' : 'Mark settled'}</button></div>
          </div>
        })}
      </section>
    </AppLayout>
  )
}

export default Settlements

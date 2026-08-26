import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import { getProfile, getSession } from '../auth.js'
import {
  getAuditLog,
  getExpenses,
  getGroups,
  getSettlements,
  saveAuditLog,
  saveExpenses,
  saveGroups,
  saveSettlements,
} from '../storage.js'

const formatINR = (amount) => `${amount < 0 ? '-' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}`

function AdminDashboard() {
  const [groups, setGroups] = useState(getGroups)
  const [expenses, setExpenses] = useState(getExpenses)
  const [settlements, setSettlements] = useState(getSettlements)
  const [auditLog, setAuditLog] = useState(getAuditLog)
  const profile = getProfile()
  const recordCount = groups.length + expenses.length + settlements.length

  const recordChange = (action, record) => {
    const nextLog = [{
      id: `${action}-${record}-${auditLog.length}`,
      action,
      record,
      admin: profile.email || getSession()?.email || 'Administrator',
      timestamp: new Date().toLocaleString('en-IN'),
    }, ...auditLog].slice(0, 30)
    setAuditLog(nextLog)
    saveAuditLog(nextLog)
  }

  const removeRecord = (type, id, label) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    if (type === 'group') {
      const nextGroups = groups.filter((group) => group.name !== id)
      setGroups(nextGroups)
      saveGroups(nextGroups)
    } else if (type === 'expense') {
      const nextExpenses = expenses.filter((expense) => expense.id !== id)
      setExpenses(nextExpenses)
      saveExpenses(nextExpenses)
    } else {
      const nextSettlements = settlements.filter((settlement) => settlement.id !== id)
      setSettlements(nextSettlements)
      saveSettlements(nextSettlements)
    }
    recordChange('Deleted', label)
  }

  const editRecord = (type, record) => {
    if (type === 'group') {
      const name = window.prompt('Group name', record.name)?.trim()
      if (!name || name === record.name) return
      const nextGroups = groups.map((group) => group.name === record.name ? { ...group, name } : group)
      setGroups(nextGroups)
      saveGroups(nextGroups)
      recordChange('Updated', `Group ${record.name} to ${name}`)
      return
    }

    if (type === 'expense') {
      const title = window.prompt('Expense title', record.title)?.trim()
      const amount = Number(window.prompt('Your share amount', Math.abs(record.yourShare)))
      if (!title || !amount || amount < 1) return
      const nextExpenses = expenses.map((expense) => expense.id === record.id ? {
        ...expense,
        title,
        yourShare: record.yourShare < 0 ? -amount : amount,
      } : expense)
      setExpenses(nextExpenses)
      saveExpenses(nextExpenses)
      recordChange('Updated', `Expense ${record.title}`)
      return
    }

    const status = window.prompt('Settlement status: pending or settled', record.status)?.trim().toLowerCase()
    if (!['pending', 'settled'].includes(status)) return
    const nextSettlements = settlements.map((settlement) => settlement.id === record.id ? { ...settlement, status } : settlement)
    setSettlements(nextSettlements)
    saveSettlements(nextSettlements)
    recordChange('Updated', `Settlement ${record.title}`)
  }

  const recordSections = [
    { title: 'Groups', type: 'group', records: groups, label: (record) => `${record.name} · ${record.members} members` },
    { title: 'Expenses', type: 'expense', records: expenses, label: (record) => `${record.title} · ${formatINR(record.yourShare)}` },
    { title: 'Settlements', type: 'settlement', records: settlements, label: (record) => `${record.title} · ${record.status}` },
  ]

  return (
    <AppLayout>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#b47b00]">Administration</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Record management</h1>
          <p className="mt-2 text-sm text-slate-500">Change shared data and keep a trace of every administrative action.</p>
        </div>
        <div className="rounded-xl bg-[#fff6ed] px-4 py-3 text-sm font-bold text-[#b6631e]">{recordCount} records tracked</div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {recordSections.map((section) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={section.type}>
          <p className="text-sm font-semibold text-slate-500">Managed {section.title.toLowerCase()}</p>
          <p className="mt-2 text-3xl font-bold text-[#102a43]">{section.records.length}</p>
        </div>)}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="space-y-4">
          {recordSections.map((section) => <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={section.type}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-[#102a43]">{section.title}</h2></div>
            {section.records.map((record) => <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-0" key={record.id || record.name}>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-[#172033]">{section.label(record)}</p><p className="mt-1 text-xs text-slate-500">{record.group || record.balance || record.date || 'Shared record'}</p></div>
              <div className="flex shrink-0 gap-2"><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-[#102a43] hover:border-[#159a8c]" onClick={() => editRecord(section.type, record)}>Edit</button><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => removeRecord(section.type, record.id || record.name, section.label(record))}>Delete</button></div>
            </div>)}
          </div>)}
        </section>

        <section className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-[#102a43]">Administrative history</h2><p className="mt-1 text-xs text-slate-500">The latest 30 changes are retained in this browser.</p></div>
          {auditLog.length ? auditLog.map((entry) => <div className="border-b border-slate-100 px-5 py-4 last:border-0" key={entry.id}><p className="text-sm font-bold text-[#172033]">{entry.action} record</p><p className="mt-1 text-xs text-slate-500">{entry.record}</p><p className="mt-2 text-[11px] text-slate-400">{entry.admin} · {entry.timestamp}</p></div>) : <p className="px-5 py-10 text-center text-sm text-slate-500">No administrative changes yet.</p>}
        </section>
      </div>
    </AppLayout>
  )
}

export default AdminDashboard

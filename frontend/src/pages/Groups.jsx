import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'

const groups = [
  { name: 'Friends', members: 6, balance: '₹1,250 owed to you', color: 'bg-[#e6f8f4] text-[#117d72]' },
  { name: 'Goa Trip', members: 4, balance: 'You owe ₹2,500', color: 'bg-[#fff6ed] text-[#b6631e]' },
  { name: 'Home', members: 3, balance: 'Settled up', color: 'bg-[#eef5ff] text-[#3569a8]' },
  { name: 'College', members: 8, balance: '₹500 owed to you', color: 'bg-[#f5efff] text-[#7651a8]' },
]

function Groups() {
  const [showForm, setShowForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupList, setGroupList] = useState(groups)

  const createGroup = (event) => {
    event.preventDefault()
    if (!groupName.trim()) return
    setGroupList([...groupList, { name: groupName.trim(), members: 1, balance: 'Settled up', color: 'bg-slate-100 text-slate-600' }])
    setGroupName('')
    setShowForm(false)
  }

  return (
    <AppLayout>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Your groups</h1>
          <p className="mt-2 text-sm text-slate-500">Keep every shared plan and balance in one place.</p>
        </div>
        <button className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72]" onClick={() => setShowForm(!showForm)}>+ Create Group</button>
      </div>

      {showForm && (
        <form className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#bfe8e2] bg-[#e6f8f4] p-5 sm:flex-row" onSubmit={createGroup}>
          <input className="min-w-0 flex-1 rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 text-sm outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" autoFocus placeholder="e.g. Apartment, Weekend trip" value={groupName} onChange={(event) => setGroupName(event.target.value)} />
          <button className="rounded-xl bg-[#102a43] px-5 py-3 text-sm font-bold text-white hover:bg-[#173c5c]" type="submit">Create</button>
        </form>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groupList.map((group) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={group.name}>
            <div className="flex items-start justify-between gap-4">
              <div className={`grid size-11 place-items-center rounded-xl text-lg font-bold ${group.color}`}>{group.name.slice(0, 1).toUpperCase()}</div>
              <button className="text-slate-400 hover:text-[#102a43]" aria-label={`Open ${group.name}`}>•••</button>
            </div>
            <h2 className="mt-5 text-lg font-bold text-[#102a43]">{group.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{group.members} members</p>
            <div className={`mt-5 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${group.color}`}>{group.balance}</div>
          </article>
        ))}
      </div>
    </AppLayout>
  )
}

export default Groups

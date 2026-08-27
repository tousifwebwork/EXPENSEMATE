// Lists the user's groups and provides the create-group workflow.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout.jsx'
import { Link } from 'react-router-dom'
import { createGroup, listGroups } from '../config/group/groupAPI.js'

function Groups() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('INR')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadGroups = async () => {
    setLoading(true)
    try {
      const response = await listGroups()
      const data = response.data
      setGroups(Array.isArray(data) ? data : data?.groups || data?.data || [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your groups.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGroups() }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (name.trim().length < 2) return setError('Group name must be at least 2 characters.')
    setSaving(true)
    try {
      await createGroup({ name: name.trim(), description: description.trim(), coverImage: coverImage.trim(), baseCurrency })
      setName('')
      setDescription('')
      setCoverImage('')
      setBaseCurrency('INR')
      setShowForm(false)
      toast.success('Group created')
      await loadGroups()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create the group.')
      toast.error('Could not create group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Your groups</h1>
          <p className="mt-2 text-sm text-slate-500">Keep every shared plan and balance in one place.</p>
        </div>
        <button className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72]" onClick={() => { setError(''); setShowForm(!showForm) }}>{showForm ? 'Close' : '+ Create Group'}</button>
      </div>

      {showForm && (
        <form className="mt-6 grid gap-3 rounded-2xl border border-[#bfe8e2] bg-[#e6f8f4] p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.55fr_auto] lg:items-end" onSubmit={handleCreate}>
          <label className="text-sm font-semibold text-[#102a43]">Group name<input className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" autoFocus placeholder="e.g. Apartment" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="text-sm font-semibold text-[#102a43]">Description <span className="font-normal text-slate-500">(optional)</span><input className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" placeholder="What is this group for?" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="text-sm font-semibold text-[#102a43]">Cover image URL <span className="font-normal text-slate-500">(optional)</span><input className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10" type="url" placeholder="https://..." value={coverImage} onChange={(event) => setCoverImage(event.target.value)} /></label>
          <label className="text-sm font-semibold text-[#102a43]">Currency<select className="mt-2 w-full rounded-xl border border-[#bfe8e2] bg-white px-4 py-3 font-normal outline-none focus:border-[#159a8c]" value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value)}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
          <button className="rounded-xl bg-[#102a43] px-5 py-3 text-sm font-bold text-white hover:bg-[#173c5c] disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Creating...' : 'Create'}</button>
        </form>
      )}

      {error && <div className="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><span>{error}</span><button className="font-bold" onClick={loadGroups}>Retry</button></div>}
      {loading ? <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div className="h-48 animate-pulse rounded-2xl bg-slate-200" /><div className="h-48 animate-pulse rounded-2xl bg-slate-200" /></div> : groups.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><div className="text-4xl">👥</div><h2 className="mt-4 text-xl font-bold text-[#102a43]">No groups yet</h2><p className="mt-2 text-sm text-slate-500">Create your first group to start sharing expenses.</p></div> : <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const id = group.id || group._id || group.groupId
          const count = group.members?.length ?? group.memberCount ?? group.membersCount ?? 0
          return <Link className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfe8e2] hover:shadow-md" key={id} to={`/groups/${id}`}>
            <div className="flex items-start justify-between gap-4">
              {group.coverImage ? <img className="size-11 rounded-xl object-cover" src={group.coverImage} alt="" /> : <div className="grid size-11 place-items-center rounded-xl bg-[#e6f8f4] text-lg font-bold text-[#117d72]">{(group.name || 'G').slice(0, 1).toUpperCase()}</div>}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${(group.isArchived || group.archived) ? 'bg-slate-100 text-slate-500' : 'bg-[#e6f8f4] text-[#117d72]'}`}>{(group.isArchived || group.archived) ? 'Archived' : 'Active'}</span>
            </div>
            <h2 className="mt-5 text-lg font-bold text-[#102a43]">{group.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{group.description || 'Shared expenses and balances'}</p>
            <p className="mt-5 text-sm font-semibold text-slate-600">{group.baseCurrency || 'INR'} · {count} {count === 1 ? 'member' : 'members'}</p>
          </Link>
        })}
      </div>}
    </AppLayout>
  )
}

export default Groups

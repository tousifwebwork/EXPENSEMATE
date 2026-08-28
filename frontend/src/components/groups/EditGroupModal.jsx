import { useEffect, useState } from 'react'

function EditGroupModal({ open, group, onClose, onSubmit, loading = false }) {
  const [form, setForm] = useState({ name: '', description: '', coverImage: '', baseCurrency: 'INR' })

  useEffect(() => {
    if (open) {
      setForm({
        name: group?.name || '',
        description: group?.description || '',
        coverImage: group?.coverImage || '',
        baseCurrency: group?.baseCurrency || 'INR',
      })
    }
  }, [open, group])

  if (!open) return null

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-label="Edit group">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#102a43]">Edit Group</h2>
          <button type="button" onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-700" aria-label="Close">x</button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
          <label className="block text-sm font-semibold text-slate-700">Group name<input required minLength={2} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]" value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label className="block text-sm font-semibold text-slate-700">Description<input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
          <label className="block text-sm font-semibold text-slate-700">Cover image URL<input type="url" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]" value={form.coverImage} onChange={(event) => update('coverImage', event.target.value)} /></label>
          <label className="block text-sm font-semibold text-slate-700">Base currency<select className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]" value={form.baseCurrency} onChange={(event) => update('baseCurrency', event.target.value)}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
          <button disabled={loading} className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white hover:bg-[#117d72] disabled:opacity-50">{loading ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  )
}

export default EditGroupModal

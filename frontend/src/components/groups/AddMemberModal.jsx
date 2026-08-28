import { useState } from 'react'

function AddMemberModal({ open, onClose, onSubmit, loading = false }) {
  const [profileId, setProfileId] = useState('')
  if (!open) return null

  const submit = async (event) => {
    event.preventDefault()
    if (!profileId.trim()) return
    await onSubmit(profileId.trim())
    setProfileId('')
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-label="Add member">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#102a43]">Add Member</h2><button type="button" onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-700" aria-label="Close">x</button></div>
        <form className="mt-6" onSubmit={submit}><label className="block text-sm font-semibold text-slate-700">Profile ID<input required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]" placeholder="ABC123" value={profileId} onChange={(event) => setProfileId(event.target.value)} /></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700">Cancel</button><button disabled={loading} className="rounded-xl bg-[#159a8c] px-4 py-2.5 font-bold text-white disabled:opacity-50">{loading ? 'Adding...' : 'Add Member'}</button></div></form>
      </div>
    </div>
  )
}

export default AddMemberModal

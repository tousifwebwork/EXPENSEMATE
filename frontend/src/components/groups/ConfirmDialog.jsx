function ConfirmDialog({ open, onCancel, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-[#102a43]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700">Cancel</button><button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2.5 font-bold text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#159a8c] hover:bg-[#117d72]'}`}>{loading ? 'Processing...' : confirmText}</button></div>
      </div>
    </div>
  )
}

export default ConfirmDialog

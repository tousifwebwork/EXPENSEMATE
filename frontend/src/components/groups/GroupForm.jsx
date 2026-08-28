import { useEffect, useState } from 'react'

function GroupForm({
  initialValues,
  onSubmit,
  submitText = 'Create Group',
  loading = false,
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverImage: '',
    baseCurrency: 'INR',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm({
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      coverImage: initialValues?.coverImage || '',
      baseCurrency: initialValues?.baseCurrency || 'INR',
    })
  }, [initialValues])

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Group name is required.'
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Group name must be at least 2 characters.'
    }

    if (form.coverImage.trim()) {
      try {
        new URL(form.coverImage.trim())
      } catch {
        nextErrors.coverImage = 'Enter a valid image URL.'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      coverImage: form.coverImage.trim(),
      baseCurrency: form.baseCurrency,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Group name
        </label>

        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Goa Trip"
          disabled={loading}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10 disabled:opacity-60"
        />

        {errors.name && (
          <p className="mt-1 text-xs font-semibold text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Description
        </label>

        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Group for Goa trip expenses"
          rows={4}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Cover image URL
        </label>

        <input
          type="url"
          value={form.coverImage}
          onChange={(e) => updateField('coverImage', e.target.value)}
          placeholder="https://example.com/goa.jpg"
          disabled={loading}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10 disabled:opacity-60"
        />

        {errors.coverImage && (
          <p className="mt-1 text-xs font-semibold text-red-600">
            {errors.coverImage}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Base currency
        </label>

        <select
          value={form.baseCurrency}
          onChange={(e) => updateField('baseCurrency', e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10 disabled:opacity-60"
        >
          <option value="INR">INR — Indian Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Please wait...' : submitText}
      </button>

    </form>
  )
}

export default GroupForm

// Lets the signed-in user edit their display name/email and pick a
// default currency. Saved straight to localStorage via auth.js.
import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import { allowedEmail, getProfile, getSession, saveProfile, startSession } from '../auth.js'

function Settings() {
  const profile = getProfile()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [currency, setCurrency] = useState('INR (₹)')
  const [saved, setSaved] = useState(false)

  const saveSettings = (event) => {
    event.preventDefault()
    if (!name.trim() || !allowedEmail.test(email)) return
    saveProfile({ ...profile, name: name.trim(), email: email.trim() })
    startSession(email.trim(), getSession()?.role || 'user')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AppLayout>
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Account</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your profile and expense preferences.</p>
      </div>

      <form className="mt-8 max-w-2xl space-y-6" onSubmit={saveSettings}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-[#102a43]">Profile details</h2>
          <p className="mt-1 text-sm text-slate-500">This information is visible to people in your groups.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Full name<input className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10" value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Email address<input className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-[#102a43]">Expense preferences</h2>
          <label className="mt-6 block text-sm font-semibold text-slate-700">Default currency<select className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10 sm:max-w-xs" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option></select></label>
        </section>
        <div className="flex items-center gap-4"><button className="rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 hover:bg-[#117d72]" type="submit">Save changes</button>{saved && <span className="text-sm font-semibold text-[#117d72]">Changes saved</span>}</div>
      </form>
    </AppLayout>
  )
}

export default Settings

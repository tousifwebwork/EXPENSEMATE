import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { allowedEmail, registerAdmin } from '../auth.js'

function AdminRegister() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!name.trim() || !email || !password || !confirmPassword) {
      setError('Please complete all fields.')
      return
    }
    if (!allowedEmail.test(email)) {
      setError('Please use a Gmail, Outlook, or Yahoo email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!registerAdmin({ name: name.trim(), email: email.trim(), password })) {
      setError('An admin account with this email already exists.')
      return
    }
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#eef3f7] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.75fr)] lg:gap-16 lg:px-20 lg:py-10">
      <div className="hidden flex-col justify-between rounded-[2rem] bg-[#102a43] p-10 text-white lg:flex">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#f4b942] text-lg font-bold text-[#102a43]">₹</div><span className="text-lg font-bold tracking-tight">ExpenseMate</span></div>
        <div><p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#f4b942]">Operations portal</p><h1 className="max-w-lg text-5xl font-bold leading-[1.05] tracking-tight">Create an admin account.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">Set up a separate administrator identity for managing ExpenseMate.</p></div>
        <p className="text-sm text-slate-400">ExpenseMate administration.</p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-lg">
        <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid size-10 place-items-center rounded-xl bg-[#102a43] text-lg font-bold text-[#f4b942]">₹</div><span className="text-lg font-bold tracking-tight text-[#102a43]">ExpenseMate</span></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(16,42,67,0.08)] sm:p-10">
          <div className="mb-8"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#b47b00]">Restricted access</p><h2 className="text-3xl font-bold tracking-tight text-[#102a43]">Admin registration</h2><p className="mt-2 text-sm leading-6 text-slate-500">Create credentials for the administration portal.</p></div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700">Full name<input className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal text-slate-900 outline-none focus:border-[#b47b00] focus:bg-white focus:ring-4 focus:ring-[#f4b942]/20" value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="block text-sm font-semibold text-slate-700">Admin email<input className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal text-slate-900 outline-none focus:border-[#b47b00] focus:bg-white focus:ring-4 focus:ring-[#f4b942]/20" type="email" placeholder="admin@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="block text-sm font-semibold text-slate-700">Password<input className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal text-slate-900 outline-none focus:border-[#b47b00] focus:bg-white focus:ring-4 focus:ring-[#f4b942]/20" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <label className="block text-sm font-semibold text-slate-700">Confirm password<input className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal text-slate-900 outline-none focus:border-[#b47b00] focus:bg-white focus:ring-4 focus:ring-[#f4b942]/20" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
            <button type="submit" className="w-full rounded-xl bg-[#102a43] px-4 py-3 font-bold text-white shadow-lg shadow-[#102a43]/20 transition hover:bg-[#183d5d]">Create admin account</button>
          </form>
          <div className="mt-8 text-center text-sm text-slate-500"><Link className="font-bold text-[#117d72] hover:text-[#102a43]" to="/admin/login">Admin sign in</Link><span className="mx-2">·</span><Link className="font-bold text-[#117d72] hover:text-[#102a43]" to="/login">User sign in</Link></div>
        </div>
      </div>
    </div>
  )
}

export default AdminRegister
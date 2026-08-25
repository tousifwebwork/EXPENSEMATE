import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { allowedEmail, authenticateUser, startSession } from '../auth.js'

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    if (!allowedEmail.test(email)) {
      setError('Please use a Gmail, Outlook, or Yahoo email address.')
      return
    }
    if (!authenticateUser(email, password)) {
      setError('No matching user account was found.')
      return
    }
    setError('')
    startSession(email, 'user')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.75fr)] lg:gap-16 lg:px-20 lg:py-10">
      <div className="hidden flex-col justify-between rounded-[2rem] bg-[#102a43] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#47c5b0] text-lg font-bold text-[#102a43]">₹</div>
          <span className="text-lg font-bold tracking-tight">ExpenseMate</span>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8bded2]">Your money, together</p>
          <h1 className="max-w-lg text-5xl font-bold leading-[1.05] tracking-tight">Split expenses. Settle up. Stress less.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">See who paid, what you owe, and where your shared money is going in one calm, organized place.</p>
        </div>
        <p className="text-sm text-slate-400">Simple tracking for real-life groups.</p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-lg">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="grid size-10 place-items-center rounded-xl bg-[#102a43] text-lg font-bold text-[#8bded2]">₹</div>
          <span className="text-lg font-bold tracking-tight text-[#102a43]">ExpenseMate</span>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(16,42,67,0.08)] sm:p-10">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Welcome back</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#102a43]">Sign in to your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Keep your shared spending on track.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">Email</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <button type="submit" className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] focus:outline-none focus:ring-4 focus:ring-[#159a8c]/20">
            Sign In
          </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? <Link className="font-bold text-[#117d72] hover:text-[#102a43]" to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn

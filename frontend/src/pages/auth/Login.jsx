import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../config/auth/authAPI'
import { Eye, EyeOff, ArrowRight, Shield, Sparkles, CheckCircle2, Lock, Mail } from 'lucide-react'

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [eye, setEye] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both email and password.')
      return
    }
    try {
      setLoading(true)
      setError('')
      const res = await login({ email, password })
      localStorage.setItem('token', res.data.token)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 overflow-hidden rounded-3xl bg-white border border-stone-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)]">

        {/* Left Side - Brand & Editorial Panel */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-10 xl:p-12 bg-[#121f28] text-white overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#159a8c]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#47c5b0]/10 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] shadow-md shadow-[#159a8c]/20 text-white font-bold text-lg tracking-tight">
              ₹
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white">ExpenseMate</span>
              <span className="text-[10px] uppercase tracking-widest font-medium text-stone-400">Financial Suite</span>
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/15 text-[#8bded2] text-xs font-semibold mb-6 border border-[#159a8c]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart group finances</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Settle shared expenses with absolute clarity.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Eliminate spreadsheet chaos. Track split expenses, view live balances, and discover optimal settlement paths in real time.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                'Multi-currency smart expense splitting',
                'Minimal-transaction debt simplification',
                'Transparent receipt attachment storage'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-[#47c5b0] shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Footer note */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
            <span>Enterprise-grade security</span>
            <span className="flex items-center gap-1 text-stone-400">
              <Shield className="w-3.5 h-3.5 text-[#47c5b0]" /> 256-bit encrypted
            </span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center bg-white">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-white font-bold text-lg">
              ₹
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">ExpenseMate</span>
          </div>

          <div className="max-w-md w-full mx-auto animate-fade-in-up">
            <div className="mb-8">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1.5">
                Authentication
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Enter your credentials to access your financial dashboard.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700" htmlFor="password">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#159a8c] hover:text-[#117d72] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={eye ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setEye(!eye)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                    aria-label={eye ? 'Hide password' : 'Show password'}
                  >
                    {eye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/80 text-xs font-medium text-red-700 animate-scale-in">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center">
              <p className="text-sm text-stone-500">
                Don't have an account yet?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-[#159a8c] hover:text-[#117d72] transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SignIn

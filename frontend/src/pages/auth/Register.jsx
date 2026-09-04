import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../config/auth/authAPI'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight, Shield, Sparkles, CheckCircle2, Lock, Mail, User } from 'lucide-react'
import { motion } from 'framer-motion'

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const [eye, setEye] = useState(false)
  const [conEye, setConEye] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await register({ name: fullName, email: email, password: password })
      toast.success('Account created successfully!')
      navigate('/login')
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
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
              <span>Join thousands of groups</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Start managing shared finances together.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Create your account in seconds and unlock sophisticated group expense tracking with automatic settlement calculations.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                'Unlimited groups and members',
                'Real-time expense synchronization',
                'Advanced split calculation engine'
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
            <span>Free to use forever</span>
            <span className="flex items-center gap-1 text-stone-400">
              <Shield className="w-3.5 h-3.5 text-[#47c5b0]" /> GDPR compliant
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
                Get Started
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Join thousands managing shared finances smarter.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full Name field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                    required
                  />
                </div>
              </div>

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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={eye ? 'text' : 'password'}
                    placeholder="Create a secure password"
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

              {/* Confirm Password field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={conEye ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setConEye(!conEye)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                    aria-label={conEye ? 'Hide password' : 'Show password'}
                  >
                    {conEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center">
              <p className="text-sm text-stone-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#159a8c] hover:text-[#117d72] transition-colors"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  )
}

export default Register

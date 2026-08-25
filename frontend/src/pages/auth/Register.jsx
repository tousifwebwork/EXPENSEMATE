import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../config/auth/authAPI'
import toast from 'react-hot-toast'
import { FaEye,FaEyeSlash  } from "react-icons/fa";

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const [eye, seteye] = useState(false)
  const [con_eye, setcon_eye] = useState(false)

  function eye_handle(){
    seteye(!eye);
  }
  function con_eye_handle(){
    setcon_eye(!con_eye);
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      toast.error('Passwords Cannot be less than 6 Characters.')
      return
    } 
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    } 
    
    try{
    setError("");
    const res = await register({name:fullName, email:email, password:password}); 
    toast.success("Register successful!");
    navigate("/login");
  }catch (error) {
    const message =error.response?.data?.message || "Something went wrong"; 
    toast.error(message);
  }
  }


  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.75fr)] lg:gap-16 lg:px-20 lg:py-10">
      <div className="hidden flex-col justify-between rounded-[2rem] bg-[#102a43] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#47c5b0] text-lg font-bold text-[#102a43]">₹</div>
          <span className="text-lg font-bold tracking-tight">ExpenseMate</span>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8bded2]">Make room for life</p>
          <h1 className="max-w-lg text-5xl font-bold leading-[1.05] tracking-tight">Shared spending, made simple.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Create a home for group expenses, settle balances clearly, and keep friendships out of the spreadsheet.</p>
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
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Get started</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#102a43]">Create your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">A clearer way to manage expenses together.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="fullName">Full Name</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

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

          <div className='relative'>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
              id="password"
              type={eye ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button" onClick={eye_handle}
              className="absolute right-4 bottom-3 text-slate-500 hover:text-[#159a8c]">
              {eye ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
             </button>
          </div>

          <div className='relative'>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
              id="confirmPassword"
               type={con_eye ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button" onClick={con_eye_handle}
              className="absolute right-4 bottom-3 text-slate-500 hover:text-[#159a8c]">
              {con_eye ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
             </button>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <button type="submit" className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] focus:outline-none focus:ring-4 focus:ring-[#159a8c]/20">
            Register
          </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Already have an account? <Link className="font-bold text-[#117d72] hover:text-[#102a43]" to="/signin">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

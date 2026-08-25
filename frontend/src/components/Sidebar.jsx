import { NavLink, useNavigate } from 'react-router-dom'
import { currentUser } from '../mockData.js'
import { logout } from '../config/auth/API.js'
import toast from 'react-hot-toast'

function Sidebar() {
  const navigate = useNavigate()
  const handleLogout = async () => {
    try {
      await logout()
    } catch {
    }
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex min-h-screen w-full flex-col bg-[#102a43] px-5 py-6 text-white lg:w-72 lg:px-6">
      <div className="flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-xl bg-[#47c5b0] text-lg font-bold text-[#102a43]">₹</div>
        <span className="text-lg font-bold tracking-tight">ExpenseMate</span>
      </div>

      <nav className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-1">
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/dashboard">
          📊 <span className="ml-2">Dashboard</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/groups">
          👥 <span className="ml-2">Groups</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/expenses">
          🧾 <span className="ml-2">Expenses</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/settlements">
          🤝 <span className="ml-2">Settlements</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/settings">
          ⚙️ <span className="ml-2">Settings</span>
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d7f3ee] text-sm font-bold text-[#117d72]">{currentUser.initials}</div>
          <div>
            <div className="text-sm font-semibold">{currentUser.name}</div>
            <div className="max-w-40 truncate text-xs text-slate-400">{currentUser.email}</div>
          </div>
        </div>
        <button className="mt-5 w-full rounded-xl border border-white/15 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

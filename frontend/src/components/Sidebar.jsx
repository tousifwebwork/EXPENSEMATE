import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../config/auth/authAPI.js'
import toast from 'react-hot-toast'
import {getProfile} from "../config/user/userAPI.js";
import { useEffect, useState } from 'react';
import { FaUserFriends } from "react-icons/fa";


function Sidebar() {
  const navigate = useNavigate();

   const [user, setUser] = useState({
      name: "",
      email: "",
      phone: "",
      preferredCurrency: "",
      profileId: "",
      status: "",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
    
        const fetchProfile = async () => {
          try {
            const res = await getProfile(token);
    
            setUser({
              name: res.data.user.name || "",
              email: res.data.user.email || "",
              phone: res.data.user.phone || "",
              preferredCurrency: res.data.user.preferredCurrency || "INR",
              profileId: res.data.user.profileId || "",
              status: res.data.user.status || "",
            });
          } catch (error) {
            console.log(error);
          }  
        };
    
        fetchProfile();
      }, []);

  const handleLogout = async () => {
    const res = await logout();
    console.log(res.data)
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate('/logout')
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
        <NavLink className={({ isActive }) =>`rounded-xl px-3 py-3 text-sm font-semibold transition flex items-center gap-2 ${isActive? 'bg-white/10 text-white': 'text-slate-300 hover:bg-white/10 hover:text-white'}`}to="/friends">
         <FaUserFriends /> <span>Friends</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/expenses">
          🧾 <span className="ml-2">Expenses</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/settlements">
          🤝 <span className="ml-2">Settlements</span>
        </NavLink>
        <NavLink className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} to="/profile">
          ⚙️ <span className="ml-2">Profile</span>
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d7f3ee] text-sm font-bold text-[#117d72]">
            {user.name.split(" ").map(word => word[0]).join("").toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="max-w-40 truncate text-xs text-slate-400">{user.email}</div>
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

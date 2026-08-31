import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../config/auth/authAPI.js'
import { getProfile } from '../config/user/userAPI.js'
import toast from 'react-hot-toast'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Users, UserPlus, Receipt, Handshake, Settings } from 'lucide-react'

function Navbar() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [user, setUser] = useState({
    name: '',
    email: '',
    profileImage: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')

    const fetchProfile = async () => {
      try {
        const res = await getProfile(token)
        setUser({
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          profileImage: res.data.user.profileImage || '',
        })
      } catch (error) {
        console.log(error)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('token')
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.log(error)
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/friends', label: 'Friends', icon: UserPlus },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/settlements', label: 'Settlements', icon: Handshake },
  ]

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#159a8c] text-base font-bold text-white sm:size-10 sm:text-lg">
              ₹
            </div>
            <span className="text-lg font-bold tracking-tight text-[#102a43] sm:text-xl">
              ExpenseMate
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#159a8c]/10 text-[#159a8c]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#102a43]'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </div>

          {/* Desktop Profile Menu */}
          <div className="hidden md:block">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                onBlur={() => setTimeout(() => setProfileMenuOpen(false), 200)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-slate-100"
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-8 place-items-center rounded-full bg-[#159a8c] text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="hidden text-left lg:block">
                  <div className="max-w-32 truncate text-sm font-semibold text-[#102a43]">
                    {user.name}
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-semibold text-[#102a43]">{user.name}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate('/profile')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Settings size={16} />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden "
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-4">
            {/* Mobile Profile Section */}
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              {user.profileImage ? (
                <img  src={user.profileImage} alt={user.name} className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#159a8c] text-sm font-bold text-white">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#102a43]">{user.name}</div>
                <div className="truncate text-xs text-slate-500">{user.email}</div>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#159a8c]/10 text-[#159a8c]'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={20} />
                  {link.label}
                </NavLink>
              )
            })}

            {/* Mobile Profile & Logout */}
            <div className="border-t border-slate-200 pt-4">
              <button onClick={() => {setMobileMenuOpen(false);navigate('/profile')}}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                <Settings size={20} />
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={20} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}


    </nav>
  )
}

export default Navbar

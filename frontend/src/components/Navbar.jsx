import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../config/auth/authAPI.js'
import { getProfile } from '../config/user/userAPI.js'
import toast from 'react-hot-toast'
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  UserPlus,
  Receipt,
  Handshake,
  Settings,
  Users,
  WalletCards,
  User as UserIcon,
  Shield,
  Sparkles,
} from 'lucide-react'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const profileDropdownRef = useRef(null)

  const [user, setUser] = useState({
    name: '',
    email: '',
    profileImage: '',
    profileId: '',
  })

  // Detect scroll for subtle glass elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchProfile = async () => {
      try {
        const res = await getProfile(token)
        if (res.data?.user) {
          setUser({
            name: res.data.user.name || '',
            email: res.data.user.email || '',
            profileImage: res.data.user.profileImage || '',
            profileId: res.data.user.profileId || '',
          })
        }
      } catch (error) {
        console.log('Error fetching user profile:', error)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.log('Logout API error:', error)
    } finally {
      localStorage.removeItem('token')
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  const navLinks = [
    {
      to: '/groups',
      label: 'Groups',
      icon: Users,
    },
    {
      to: '/friends',
      label: 'Friends',
      icon: UserPlus,
    },
    {
      to: '/expenses',
      label: 'Expenses',
      icon: Receipt,
    },
    {
      to: '/balances',
      label: 'Balances',
      icon: WalletCards,
    },
    {
      to: '/settlement-suggestions',
      label: 'Settlements',
      icon: Handshake,
    },
  ]

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'
          : 'bg-white border-b border-stone-200'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo & Brand */}
          <NavLink
            to="/groups"
            className="flex items-center gap-3 group shrink-0 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-white font-bold text-base shadow-sm shadow-[#159a8c]/25 transition-transform duration-200 group-hover:scale-105">
              ₹
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
                ExpenseMate
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                      isActive
                        ? 'bg-stone-100 text-[#159a8c] font-bold shadow-xs'
                        : 'text-stone-600 hover:text-[#1a1a1a] hover:bg-stone-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Right Area: Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-stone-200/80 bg-white hover:bg-stone-50 hover:border-stone-300 transition-all duration-150 cursor-pointer text-left"
                aria-label="User profile menu"
                aria-expanded={profileMenuOpen}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || 'User'}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-stone-200"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#159a8c]/15 text-[#159a8c] font-bold text-xs">
                    {getInitials(user.name)}
                  </div>
                )}

                <div className="hidden lg:block max-w-[120px] truncate">
                  <div className="text-xs font-semibold text-[#1a1a1a] truncate">
                    {user.name || 'Account'}
                  </div>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                    profileMenuOpen ? 'rotate-180 text-stone-700' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10 animate-scale-in z-50">
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-stone-100 mb-1">
                    <div className="text-sm font-bold text-[#1a1a1a] truncate">
                      {user.name || 'ExpenseMate User'}
                    </div>
                    <div className="text-xs text-stone-500 truncate mt-0.5">
                      {user.email || 'user@example.com'}
                    </div>
                    {user.profileId && (
                      <div className="mt-1.5 inline-block text-[10px] font-mono font-medium px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                        ID: {user.profileId}
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false)
                        navigate('/profile')
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 rounded-xl hover:bg-stone-100/80 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-stone-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-fade-in-down">
          {/* Mobile Profile Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-stone-200"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#159a8c] text-white font-bold text-sm">
                {getInitials(user.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[#1a1a1a] truncate">
                {user.name || 'ExpenseMate User'}
              </div>
              <div className="text-xs text-stone-500 truncate">
                {user.email || 'user@example.com'}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#159a8c]/10 text-[#159a8c] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </div>

          {/* Mobile Actions */}
          <div className="pt-2 border-t border-stone-100 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/profile')
              }}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-stone-400" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Wallet,
  ShieldCheck,
  Hash,
  FileText,
  ArrowLeft,
  CalendarDays,
  CircleUserRound,
  Database,
  Loader2,
} from 'lucide-react'

import AppLayout from '../components/AppLayout.jsx'
import { getUserById } from '../config/user/userAPI.js'

const ViewProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    const fetchUser = async () => {
      try {
        if (!userId) {
          console.error('User ID is missing')
          return
        }

        const res = await getUserById(userId, token)

        console.log('PROFILE DATA:', res.data.user)

        setUser(res.data.user)
      } catch (error) {
        console.error(
          'GET USER ERROR:',
          error.response?.data || error.message
        )
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not available'

    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Reusable information card
  const InfoItem = ({ icon: Icon, label, value, mono = false }) => {
    return (
      <div className="flex gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm">
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {label}
          </p>

          <p
            className={`mt-1.5 break-words text-sm font-semibold text-stone-800 ${
              mono ? 'font-mono text-xs' : ''
            }`}
          >
            {value || 'Not provided'}
          </p>
        </div>
      </div>
    )
  }

  // Reusable section
  const Section = ({ icon: Icon, title, children }) => {
    return (
      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="pb-6 border-b border-stone-100">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
            <Icon className="w-3.5 h-3.5" />
            <span>{title}</span>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </section>
    )
  }

  // Loading
  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#159a8c]" />

              <p className="mt-4 text-sm font-medium text-stone-500">
                Loading profile...
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // User not found
  if (!user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <CircleUserRound className="mx-auto w-12 h-12 text-stone-300" />

              <h2 className="mt-4 text-xl font-bold text-[#1a1a1a]">
                User not found
              </h2>

              <p className="mt-2 text-sm text-stone-500">
                The requested profile could not be loaded.
              </p>

              <button
                onClick={() => navigate(-1)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117d72] active:scale-95 shadow-sm shadow-[#159a8c]/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const fullName = user.name || 'Unnamed User'

  const getInitials = (name = '') => {
    if (!name) return 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8 animate-fade-in-up">
        {/* ================= BACK BUTTON ================= */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-[#159a8c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* ================= HEADER ================= */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5" />
            <span>User Profile</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Profile Details
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Complete personal, contact, and account information.
          </p>
        </div>

        {/* ================= PROFILE HERO ================= */}
        <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
          {/* BANNER */}
          <div className="h-32 bg-gradient-to-br from-[#159a8c] via-[#47c5b0] to-[#0e6d63] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          </div>

          <div className="px-6 sm:px-8 pb-8">
            <div className="-mt-16 flex flex-col sm:flex-row sm:items-end gap-6">
              {/* PROFILE IMAGE */}
              <div className="relative mx-auto sm:mx-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={fullName}
                    className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-xl"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-4xl font-bold text-white shadow-xl">
                    {getInitials(fullName)}
                  </div>
                )}
              </div>

              {/* PROFILE INFO */}
              <div className="flex-1 text-center sm:text-left pb-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a]">
                  {fullName}
                </h2>

                <p className="mt-1.5 text-sm text-stone-600 flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {user.email || 'Email not provided'}
                  </span>
                </p>

                <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="capitalize">
                      {user.status || 'Active'}
                    </span>
                  </span>

                  {user.profileId && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-mono font-medium text-stone-600">
                      <Hash className="w-3 h-3" />
                      <span>{user.profileId}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="mt-7 grid gap-4 border-t border-stone-100 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                  <Wallet className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Currency
                  </p>

                  <p className="text-sm font-bold text-stone-700 truncate">
                    {user.preferredCurrency || 'INR'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                  <CalendarDays className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Joined
                  </p>

                  <p className="text-sm font-bold text-stone-700 truncate">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                  <CalendarDays className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Updated
                  </p>

                  <p className="text-sm font-bold text-stone-700 truncate">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ABOUT ================= */}
        <Section icon={FileText} title="About">
          <div className="rounded-xl bg-stone-50/70 border border-stone-100 p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-stone-600">
              {user.about ||
                'No information has been provided by this user.'}
            </p>
          </div>
        </Section>

        {/* ================= PERSONAL INFORMATION ================= */}
        <Section icon={User} title="Personal Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem icon={User} label="Full Name" value={user.name} />

            <InfoItem icon={Mail} label="Email Address" value={user.email} />

            <InfoItem icon={Phone} label="Phone Number" value={user.phone} />

            <InfoItem
              icon={Hash}
              label="Profile ID"
              value={user.profileId}
              mono
            />
          </div>
        </Section>

        {/* ================= ACCOUNT INFORMATION ================= */}
        <Section icon={ShieldCheck} title="Account Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              icon={ShieldCheck}
              label="Account Status"
              value={user.status || 'Active'}
            />

            <InfoItem
              icon={Wallet}
              label="Preferred Currency"
              value={user.preferredCurrency || 'INR'}
            />

            <InfoItem
              icon={CalendarDays}
              label="Account Created"
              value={formatDate(user.createdAt)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Last Updated"
              value={formatDate(user.updatedAt)}
            />
          </div>
        </Section>

        {/* ================= ADDRESS ================= */}
        <Section icon={MapPin} title="Address">
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoItem
              icon={MapPin}
              label="Landmark"
              value={user.address?.landmark}
            />

            <InfoItem icon={MapPin} label="State" value={user.address?.state} />

            <InfoItem
              icon={Globe}
              label="Country"
              value={user.address?.country}
            />
          </div>
        </Section>

        {/* ================= SYSTEM INFORMATION ================= */}
        <Section icon={Database} title="System Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              icon={Database}
              label="MongoDB User ID"
              value={user._id}
              mono
            />

            <InfoItem
              icon={Hash}
              label="Profile ID"
              value={user.profileId}
              mono
            />

            <InfoItem
              icon={CalendarDays}
              label="Created At"
              value={formatDate(user.createdAt)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Updated At"
              value={formatDate(user.updatedAt)}
            />
          </div>
        </Section>
      </div>
    </AppLayout>
  )
}

export default ViewProfile

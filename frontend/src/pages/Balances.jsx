import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AppLayout from '../components/AppLayout'

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowRight,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

const Balances = () => {
  const navigate = useNavigate()

  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [balances, setBalances] = useState([])

  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingBalances, setLoadingBalances] = useState(false)

  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  // Get groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true)

        const res = await axios.get('http://localhost:3000/api/groups', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setGroups(res.data.groups || [])
      } catch (error) {
        console.log(error)
        setError(error.response?.data?.message || 'Failed to load groups')
      } finally {
        setLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [token])

  // Get balances
  useEffect(() => {
    if (!selectedGroup) {
      setBalances([])
      return
    }

    const fetchBalances = async () => {
      try {
        setLoadingBalances(true)
        setError('')

        const res = await axios.get(
          `http://localhost:3000/api/balance/group/${selectedGroup}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setBalances(res.data.balances || [])
      } catch (error) {
        console.log(error)

        setError(error.response?.data?.message || 'Failed to load balances')
      } finally {
        setLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [selectedGroup, token])

  const totalPaid = balances.reduce((sum, item) => sum + item.totalPaid, 0)

  const totalSpent = balances.reduce((sum, item) => sum + item.totalSpent, 0)

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
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in-up">
        {/* ================= HEADER ================= */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
            <Wallet className="w-3.5 h-3.5" />
            <span>Activity</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Balances
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            See who owes money and who gets money across your groups.
          </p>
        </div>

        {/* ================= GROUP SELECTOR ================= */}
        <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-3">
            Select Group
          </label>

          {loadingGroups ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading groups...</span>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Users className="w-4 h-4" />
              </div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer appearance-none sm:max-w-md"
              >
                <option value="">Choose a group</option>

                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="rounded-2xl border border-red-200/80 bg-red-50/70 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!selectedGroup && !loadingGroups && (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-sm">
            <Wallet className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-stone-900">Select a group</h2>
            <p className="mt-2 text-sm text-stone-500">
              Choose a group above to see its balances
            </p>
          </div>
        )}

        {/* ================= LOADING ================= */}
        {selectedGroup && loadingBalances && (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-[#159a8c] animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-stone-600">
              Loading balances...
            </p>
          </div>
        )}

        {/* ================= BALANCES ================= */}
        {selectedGroup && !loadingBalances && balances.length > 0 && (
          <>
            {/* SUMMARY CARDS */}
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Total Paid */}
              <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Total Paid
                  </p>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                  ₹{totalPaid.toFixed(2)}
                </h2>
              </div>

              {/* Total Spent */}
              <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-amber-50/50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Total Spent
                  </p>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                  ₹{totalSpent.toFixed(2)}
                </h2>
              </div>

              {/* Members */}
              <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Members
                  </p>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                  {balances.length}
                </h2>
              </div>
            </div>

            {/* MEMBER BALANCES */}
            <section className="rounded-3xl border border-stone-200/80 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-stone-100 px-6 sm:px-8 py-6">
                <h2 className="text-xl font-bold text-[#1a1a1a]">
                  Member Balances
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Individual spending and balance details
                </p>
              </div>

              <div className="divide-y divide-stone-100">
                {balances.map((item) => (
                  <div
                    key={item.user._id}
                    className="flex flex-col gap-4 px-6 sm:px-8 py-6 sm:flex-row sm:items-center sm:justify-between hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-sm font-bold text-white shadow-sm">
                        {getInitials(item.user.name)}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#1a1a1a] text-sm truncate">
                          {item.user.name}
                        </h3>
                        <p className="text-xs text-stone-500 mt-1">
                          Paid{' '}
                          <span className="font-semibold text-emerald-600">
                            ₹{item.totalPaid.toFixed(2)}
                          </span>
                          {' · '}
                          Spent{' '}
                          <span className="font-semibold text-amber-600">
                            ₹{item.totalSpent.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="sm:text-right shrink-0">
                      {item.balance > 0 ? (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-700">
                            Gets ₹{item.balance.toFixed(2)}
                          </span>
                        </div>
                      ) : item.balance < 0 ? (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-4 py-2">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-bold text-red-700">
                            Owes ₹{Math.abs(item.balance).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-stone-100 border border-stone-200/60 px-4 py-2">
                          <CheckCircle2 className="w-4 h-4 text-stone-500" />
                          <span className="text-sm font-bold text-stone-600">
                            Settled
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SETTLEMENT BUTTON */}
            <div className="flex justify-end pt-2 pb-4">
              <button
                onClick={() =>
                  navigate(`/settlement-suggestions?groupId=${selectedGroup}`)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all"
              >
                <DollarSign className="w-4 h-4" />
                <span>View Settlement Suggestions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default Balances

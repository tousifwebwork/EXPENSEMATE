import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import AppLayout from '../components/AppLayout'

import {
  DollarSign,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calculator,
} from 'lucide-react'

const SettlementSuggestions = () => {
  const [searchParams] = useSearchParams()

  const groupId = searchParams.get('groupId')

  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(groupId || '')

  const [suggestions, setSuggestions] = useState([])

  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  // Get groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
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

  // Get settlement suggestions
  useEffect(() => {
    if (!selectedGroup) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true)
        setError('')

        const res = await axios.get(
          `http://localhost:3000/api/balance/group/${selectedGroup}/suggestions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setSuggestions(res.data.suggestions || [])
      } catch (error) {
        console.log(error)

        setError(
          error.response?.data?.message ||
            'Failed to load settlement suggestions'
        )
      } finally {
        setLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
  }, [selectedGroup, token])

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
            <Calculator className="w-3.5 h-3.5" />
            <span>Activity</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Settlement Suggestions
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Find the minimum payments needed to settle everyone in your group.
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
            <Calculator className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-stone-900">Select a group</h2>
            <p className="mt-2 text-sm text-stone-500">
              Choose a group to see settlement suggestions
            </p>
          </div>
        )}

        {/* ================= LOADING ================= */}
        {selectedGroup && loadingSuggestions && (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-[#159a8c] animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-stone-600">
              Calculating settlements...
            </p>
          </div>
        )}

        {/* ================= ALL SETTLED ================= */}
        {selectedGroup &&
          !loadingSuggestions &&
          suggestions.length === 0 && (
            <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-12 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-xl font-bold text-emerald-900">
                Everyone is settled!
              </h2>

              <p className="mt-2 text-sm text-emerald-700">
                No payments are required between members
              </p>
            </div>
          )}

        {/* ================= SUGGESTIONS ================= */}
        {selectedGroup &&
          !loadingSuggestions &&
          suggestions.length > 0 && (
            <>
              {/* Info Banner */}
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-5 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">
                    {suggestions.length}{' '}
                    {suggestions.length === 1 ? 'payment' : 'payments'} needed
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    These transactions will settle all balances in this group
                  </p>
                </div>
              </div>

              {/* Settlement Cards */}
              <div className="space-y-4">
                {suggestions.map((item, index) => (
                  <article
                    key={index}
                    className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                      {/* From */}
                      <div className="text-center sm:text-left flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                          Pays
                        </p>

                        <div className="flex items-center justify-center sm:justify-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-sm font-bold text-white shadow-sm">
                            {getInitials(item.fromName)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                              {item.fromName}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Arrow + Amount */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#159a8c]/10 text-[#159a8c]">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                        <div className="rounded-xl bg-[#159a8c] px-5 py-2 shadow-sm shadow-[#159a8c]/20">
                          <span className="text-lg sm:text-xl font-extrabold text-white">
                            ₹{item.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* To */}
                      <div className="text-center sm:text-right flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                          Receives
                        </p>

                        <div className="flex items-center justify-center sm:justify-end gap-3">
                          <div className="min-w-0 sm:order-first">
                            <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                              {item.toName}
                            </h3>
                          </div>

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-sm">
                            {getInitials(item.toName)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
      </div>
    </AppLayout>
  )
}

export default SettlementSuggestions

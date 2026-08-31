import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import AppLayout from '../components/AppLayout'

const SettlementSuggestions = () => {
  const [searchParams] = useSearchParams()

  const groupId = searchParams.get('groupId')

  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(groupId || '')

  const [suggestions, setSuggestions] = useState([])

  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] =
    useState(false)

  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  // Get groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(
          'http://localhost:3000/api/groups',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setGroups(res.data.groups || [])
      } catch (error) {
        console.log(error)

        setError(
          error.response?.data?.message ||
            'Failed to load groups'
        )
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

  return (
  <AppLayout>
    <div className="min-h-screen bg-slate-50 ">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Activity</p>


          <h1 className="text-3xl font-bold text-[#102a43]">
            Settlement Suggestions
          </h1>

          <p className="mt-1 text-slate-500">
            Find the minimum payments needed to settle everyone.
          </p>
        </div>

        {/* Group Selector */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Group
          </label>

          {loadingGroups ? (
            <p className="text-slate-500">
              Loading groups...
            </p>
          ) : (
            <select
              value={selectedGroup}
              onChange={(e) =>
                setSelectedGroup(e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c] sm:max-w-md"
            >
              <option value="">
                Select a group
              </option>

              {groups.map((group) => (
                <option
                  key={group._id}
                  value={group._id}
                >
                  {group.name}
                </option>
              ))}
            </select>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Nothing selected */}
        {!selectedGroup && !loadingGroups && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Select a group
            </h2>

            <p className="mt-2 text-slate-500">
              Choose a group to see settlement suggestions.
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedGroup && loadingSuggestions && (
          <div className="py-10 text-center text-slate-500">
            Calculating settlements...
          </div>
        )}

        {/* No settlements */}
        {selectedGroup &&
          !loadingSuggestions &&
          suggestions.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-green-100 text-2xl text-green-600">
                ✓
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Everyone is settled!
              </h2>

              <p className="mt-2 text-slate-500">
                No payments are required between members.
              </p>

            </div>
          )}

        {/* Suggestions */}
        {selectedGroup &&
          !loadingSuggestions &&
          suggestions.length > 0 && (
            <div className="space-y-4">

              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">

                    {/* From */}
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pays
                      </p>

                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {item.fromName}
                      </h2>
                    </div>

                    {/* Amount */}
                    <div className="text-center">

                      <div className="text-sm text-slate-400">
                        →
                      </div>

                      <div className="text-xl font-bold text-[#159a8c]">
                        ₹{item.amount.toFixed(2)}
                      </div>

                    </div>

                    {/* To */}
                    <div className="text-center sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Receives
                      </p>

                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {item.toName}
                      </h2>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

      </div>
    </div>
  </AppLayout>
  )
}

export default SettlementSuggestions
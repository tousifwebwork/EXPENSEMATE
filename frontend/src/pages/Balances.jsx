import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AppLayout from '../components/AppLayout'

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

        setError(
          error.response?.data?.message ||
            'Failed to load balances'
        )
      } finally {
        setLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [selectedGroup, token])

  const totalPaid = balances.reduce(
    (sum, item) => sum + item.totalPaid,
    0
  )

  const totalSpent = balances.reduce(
    (sum, item) => sum + item.totalSpent,
    0
  )

  return (
    <AppLayout>
    <div className="min-h-screen bg-slate-50 ">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">Activity</p>


          <h1 className="text-3xl font-bold text-[#102a43]">
            Balances
          </h1>

          <p className="mt-1 text-slate-500">
            See who owes money and who gets money.
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
            <select value={selectedGroup}  onChange={(e) => setSelectedGroup(e.target.value) }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c] sm:max-w-md">
              <option value="">
                Select a group
              </option>

              {groups.map((group) => (
                <option  key={group._id} value={group._id}  >
                  {group.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {!selectedGroup && !loadingGroups && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Select a group
            </h2>

            <p className="mt-2 text-slate-500">
              Choose a group above to see its balances.
            </p>
          </div>
        )}

        {selectedGroup && loadingBalances && (
          <div className="py-10 text-center text-slate-500">
            Loading balances...
          </div>
        )}

        {selectedGroup &&
          !loadingBalances &&
          balances.length > 0 && (
            <>
              {/* Summary */}
              <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Total Paid
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    ₹{totalPaid.toFixed(2)}
                  </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Total Spent
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    ₹{totalSpent.toFixed(2)}
                  </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Members
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {balances.length}
                  </h2>
                </div>

              </div>

              {/* Members */}
              <div className="rounded-2xl bg-white shadow-sm">

                <div className="border-b border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    Member Balances
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">

                  {balances.map((item) => (
                    <div
                      key={item.user._id}
                      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">

                        <div className="grid size-12 place-items-center rounded-full bg-[#159a8c]/10 font-bold text-[#159a8c]">
                          {item.user.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {item.user.name}
                          </h3>

                          <p className="text-sm text-slate-500">
                            Paid ₹
                            {item.totalPaid.toFixed(2)}
                            {' · '}
                            Spent ₹
                            {item.totalSpent.toFixed(2)}
                          </p>
                        </div>

                      </div>

                      <div className="sm:text-right">

                        <p
                          className={`text-lg font-bold ${
                            item.balance > 0
                              ? 'text-green-600'
                              : item.balance < 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.balance > 0
                            ? `Gets ₹${item.balance.toFixed(2)}`
                            : item.balance < 0
                            ? `Owes ₹${Math.abs(
                                item.balance
                              ).toFixed(2)}`
                            : 'Settled'}
                        </p>

                      </div>
                    </div>
                  ))}

                </div>
              </div>

              {/* Settlement Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() =>
                    navigate(
                      `/settlement-suggestions?groupId=${selectedGroup}`
                    )
                  }
                  className="rounded-xl bg-[#159a8c] px-5 py-3 font-semibold text-white transition hover:bg-[#128579]"
                >
                  View Settlement Suggestions
                </button>
              </div>
            </>
          )}
      </div>
    </div>
    </AppLayout>
  )
}

export default Balances
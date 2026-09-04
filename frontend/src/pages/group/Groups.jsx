import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import AppLayout from '../../components/AppLayout'
import {
  createGroup,
  getMyGroups,
  deleteGroup,
} from '../../config/group/groupAPI'

import {
  Plus,
  Users,
  ArrowRight,
  Trash2,
  Sparkles,
  Layers,
  Coins,
  AlignLeft,
  X,
  ShieldAlert,
  FolderPlus,
  Compass,
} from 'lucide-react'
import { motion } from 'framer-motion'

const Groups = () => {
  const [groupInfo, setGroupInfo] = useState({
    name: '',
    description: '',
    coverImage: '',
    baseCurrency: 'INR',
  })

  const [allGroups, setAllGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const navigate = useNavigate()
  const location = useLocation()

  // =========================
  // GET CURRENT USER ID
  // =========================
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }
      const decoded = jwtDecode(token)
      setCurrentUserId(decoded.userId)
    } catch (err) {
      console.log('JWT Decode Error:', err)
      toast.error('Invalid login session')
    }
  }, [])

  // =========================
  // GET MY GROUPS
  // =========================
  useEffect(() => {
    const handleGetGroup = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')

        if (!token) {
          toast.error('Please login again')
          return
        }

        const res = await getMyGroups(token)
        setAllGroups(res.data.groups || [])
      } catch (err) {
        console.log(err)
        toast.error(err.response?.data?.message || 'Failed to load groups')
      } finally {
        setLoading(false)
      }
    }

    handleGetGroup()
  }, [location.pathname])

  // =========================
  // CREATE GROUP
  // =========================
  const handleCreateGroup = async (e) => {
    e?.preventDefault()

    if (!groupInfo.name.trim()) {
      toast.error('Please enter group name!')
      return
    }

    if (!groupInfo.description.trim()) {
      toast.error('Please enter group description!')
      return
    }

    if (!groupInfo.baseCurrency) {
      toast.error('Please select base currency!')
      return
    }

    try {
      setCreating(true)
      const token = localStorage.getItem('token')

      if (!token) {
        toast.error('Please login again')
        return
      }

      const res = await createGroup(groupInfo, token)

      // Add newly created group immediately
      setAllGroups((prev) => [...prev, res.data.group])

      // Close modal
      const modal = document.getElementById('add_group_modal')
      if (modal) {
        modal.close()
      }

      toast.success('Group created successfully!')

      // Reset form
      setGroupInfo({
        name: '',
        description: '',
        coverImage: '',
        baseCurrency: 'INR',
      })
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to create group!')
    } finally {
      setCreating(false)
    }
  }

  // =========================
  // DELETE GROUP
  // =========================
  const handleDeleteGroup = async (id, groupName) => {
    const ask = window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)
    if (!ask) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      await deleteGroup(id, token)

      // Immediately remove from UI
      setAllGroups((prev) => prev.filter((group) => group._id !== id))
      toast.success('Group deleted successfully!')
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to delete group!')
    }
  }

  // Filter groups based on search query
  const filteredGroups = allGroups.filter((g) => {
    if (!searchQuery.trim()) return true
    return (
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      case 'INR':
      default:
        return '₹'
    }
  }

  return (
    <AppLayout>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Your Groups
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-xl">
            Manage shared expenses, view live member balances, and coordinate split payments with ease.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              document.getElementById('add_group_modal')?.showModal()
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* =========================
          SEARCH & FILTER BAR
      ========================= */}
      {allGroups.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm placeholder:text-stone-400 focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
            />
          </div>
          <div className="text-xs font-medium text-stone-500 self-center">
            Showing {filteredGroups.length} of {allGroups.length} groups
          </div>
        </div>
      )}

      {/* =========================
          GROUPS GRID
      ========================= */}
      {loading ? (
        /* LOADING SKELETONS */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-stone-100" />
                <div className="h-6 w-16 rounded-full bg-stone-100" />
              </div>
              <div className="h-6 w-3/4 rounded-lg bg-stone-100 mt-4" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-stone-100" />
                <div className="h-4 w-2/3 rounded bg-stone-100" />
              </div>
              <div className="pt-4 border-t border-stone-100 flex justify-between">
                <div className="h-4 w-20 rounded bg-stone-100" />
                <div className="h-4 w-24 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        /* EMPTY STATE */
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-stone-200 shadow-xs max-w-2xl mx-auto my-8 animate-fade-in-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#159a8c]/10 text-[#159a8c] mb-4">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#1a1a1a]">
            {searchQuery ? 'No matching groups found' : 'No groups created yet'}
          </h3>
          <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `No groups match your search for "${searchQuery}". Try a different keyword.`
              : 'Create a group to start tracking shared expenses with your friends, roommates, or travel partners.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                document.getElementById('add_group_modal')?.showModal()
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#117d72] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Group</span>
            </button>
          )}
        </div>
      ) : (
        /* GROUPS CARDS */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group, index) => {
            // Find current user's role
            const currentMember = group.members?.find((member) => {
              const memberUserId = member.user?._id || member.user
              return memberUserId?.toString() === currentUserId?.toString()
            })

            let currentUserRole = currentMember?.role
            const ownerId = group.owner?._id || group.owner

            if (ownerId?.toString() === currentUserId?.toString()) {
              currentUserRole = 'owner'
            }

            const canDeleteGroup =
              currentUserRole === 'owner' || currentUserRole === 'admin'

            const initials = group.name
              ? group.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'GP'

            return (
              <motion.div
                key={group._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-stone-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* TOP SECTION */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    {/* GROUP AVATAR */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#159a8c]/15 to-[#0e6d63]/20 text-[#159a8c] font-bold text-base shadow-xs ring-1 ring-[#159a8c]/20">
                      {initials}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* CURRENCY BADGE */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                        <span className="text-[#159a8c] font-bold">
                          {getCurrencySymbol(group.baseCurrency)}
                        </span>
                        <span>{group.baseCurrency || 'INR'}</span>
                      </span>

                      {/* DELETE BUTTON */}
                      {canDeleteGroup && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGroup(group._id, group.name)
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Group"
                          aria-label={`Delete ${group.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GROUP NAME */}
                  <h2 className="mt-5 text-xl font-bold tracking-tight text-[#1a1a1a] group-hover:text-[#159a8c] transition-colors">
                    {group.name}
                  </h2>

                  {/* DESCRIPTION */}
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-stone-500">
                    {group.description || 'No description provided.'}
                  </p>

                  {/* ROLE BADGE */}
                  {currentUserRole && (
                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          currentUserRole === 'owner'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : currentUserRole === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            currentUserRole === 'owner'
                              ? 'bg-emerald-500'
                              : currentUserRole === 'admin'
                              ? 'bg-indigo-500'
                              : 'bg-stone-400'
                          }`}
                        />
                        <span className="capitalize">{currentUserRole}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* FOOTER */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <Users className="w-4 h-4 text-stone-400" />
                    <span className="font-semibold text-stone-700">
                      {group.members?.length || 0}
                    </span>
                    <span>{group.members?.length === 1 ? 'member' : 'members'}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/groups/${group._id}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] hover:text-[#117d72] transition-colors cursor-pointer group-hover:translate-x-0.5 duration-150"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* =========================
          ADD GROUP MODAL
      ========================= */}
      <dialog
        id="add_group_modal"
        className="fixed inset-0 m-auto w-[92%] max-w-lg rounded-3xl border-0 p-0 shadow-2xl backdrop:bg-stone-900/60 backdrop:backdrop-blur-xs open:animate-scale-in"
      >
        <div className="bg-white p-6 sm:p-8">
          {/* MODAL HEADER */}
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a]">
                Create a Group
              </h3>
            </div>
            <form method="dialog">
              <button
                type="submit"
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>

          <form onSubmit={handleCreateGroup} className="mt-6 space-y-4">
            {/* GROUP NAME */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Group Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Users className="w-4 h-4" />
                </div>
                <input
                  value={groupInfo.name}
                  onChange={(e) =>
                    setGroupInfo({ ...groupInfo, name: e.target.value })
                  }
                  type="text"
                  placeholder="e.g. Goa Trip 2026, Apartment 4B"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Description
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <AlignLeft className="w-4 h-4" />
                </div>
                <input
                  value={groupInfo.description}
                  onChange={(e) =>
                    setGroupInfo({
                      ...groupInfo,
                      description: e.target.value,
                    })
                  }
                  type="text"
                  placeholder="e.g. Shared expenses for hotel, travel & meals"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* BASE CURRENCY */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Base Currency
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Coins className="w-4 h-4" />
                </div>
                <select
                  value={groupInfo.baseCurrency}
                  onChange={(e) =>
                    setGroupInfo({
                      ...groupInfo,
                      baseCurrency: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
              <form method="dialog">
                <button
                  type="submit"
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                <span>{creating ? 'Creating...' : 'Create Group'}</span>
                {!creating && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </AppLayout>
  )
}

export default Groups

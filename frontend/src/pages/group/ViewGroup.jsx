import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import AppLayout from '../../components/AppLayout'
import {
  getGroupById,
  updateGroup,
  addMember,
  updateMemberRole,
  removeMember,
  toggleArchive,
  deleteGroup,
} from '../../config/group/groupAPI'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import {
  ArrowLeft,
  Users,
  Coins,
  Receipt,
  Plus,
  Settings,
  Archive,
  ArchiveRestore,
  Trash2,
  UserPlus,
  UserMinus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  ChevronRight,
} from 'lucide-react'

const ViewGroup = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [profileId, setProfileId] = useState('')
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    baseCurrency: 'INR',
  })

  // GET GROUP
  const loadGroup = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }
      const decoded = jwtDecode(token)
      setCurrentUserId(decoded.userId)
      const res = await getGroupById(groupId, token)
      setGroup(res.data.group)
      setEditData({
        name: res.data.group.name,
        description: res.data.group.description || '',
        baseCurrency: res.data.group.baseCurrency || 'INR',
      })
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroup()
  }, [groupId])

  // CURRENT USER MEMBERSHIP
  const currentMember = group?.members?.find(
    (member) =>
      (member.user?._id || member.user)?.toString() === currentUserId?.toString()
  )
  let currentUserRole = currentMember?.role

  const ownerId = group?.owner?._id || group?.owner
  if (ownerId?.toString() === currentUserId?.toString()) {
    currentUserRole = 'owner'
  }

  // EDIT GROUP OWNER / ADMIN ONLY
  const handleUpdateGroup = async (e) => {
    e?.preventDefault()
    if (!editData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    try {
      setUpdating(true)
      const token = localStorage.getItem('token')
      const res = await updateGroup(groupId, editData, token)
      setGroup(res.data.group)
      toast.success('Group settings updated successfully!')
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to update group')
    } finally {
      setUpdating(false)
    }
  }

  // ADD MEMBER OWNER / ADMIN ONLY
  const handleAddMember = async (e) => {
    e?.preventDefault()
    if (!profileId.trim()) {
      toast.error('Please enter a Profile ID')
      return
    }
    try {
      setAddingMember(true)
      const token = localStorage.getItem('token')
      await addMember(groupId, { profileId: profileId.trim() }, token)
      setProfileId('')
      await loadGroup()
      toast.success('Member added successfully!')
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  // CHANGE ROLE OWNER ONLY
  const handleRoleChange = async (memberId, role) => {
    try {
      const token = localStorage.getItem('token')
      await updateMemberRole(groupId, memberId, { role }, token)
      await loadGroup()
      toast.success('Member role updated!')
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to update role')
    }
  }

  // REMOVE MEMBER OWNER / ADMIN
  const handleRemoveMember = async (memberId, memberName) => {
    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${memberName || 'this member'} from the group?`
    )
    if (!confirmRemove) return

    try {
      const token = localStorage.getItem('token')
      await removeMember(groupId, memberId, token)
      await loadGroup()
      toast.success('Member removed successfully!')
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  // ARCHIVE / REOPEN OWNER ONLY
  const handleArchive = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await toggleArchive(groupId, token)
      setGroup(res.data.group)
      toast.success(res.data.message || 'Group status updated')
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to update group status')
    }
  }

  // DELETE GROUP OWNER / ADMIN
  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this group? All expenses and data will be lost.'
    )
    if (!confirmDelete) return
    try {
      const token = localStorage.getItem('token')
      await deleteGroup(groupId, token)
      toast.success('Group deleted successfully!')
      setTimeout(() => {
        navigate('/groups')
      }, 800)
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to delete group')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'GP'
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // LOADING SKELETON
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
          <div className="h-6 w-32 rounded-lg bg-stone-200" />
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-64 rounded-xl bg-stone-200" />
              <div className="h-4 w-96 rounded-lg bg-stone-200" />
            </div>
            <div className="h-10 w-28 rounded-xl bg-stone-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-3xl bg-stone-100 p-6" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-stone-100 p-6" />
        </div>
      </AppLayout>
    )
  }

  // GROUP NOT FOUND
  if (!group) {
    return (
      <AppLayout>
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Group Not Found</h2>
          <p className="mt-2 text-sm text-stone-500">
            The group you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#117d72] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Groups</span>
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        {/* =========================
            BREADCRUMBS & NAVIGATION
        ========================= */}
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <button
            onClick={() => navigate('/groups')}
            className="inline-flex items-center gap-1.5 hover:text-[#159a8c] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Groups</span>
          </button>
          <ChevronRight className="w-3 h-3 text-stone-300" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">
            {group.name}
          </span>
        </div>

        {/* =========================
            GROUP HERO HEADER
        ========================= */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between pb-6 border-b border-stone-200/80">
          <div className="flex items-start gap-4">
            {/* AVATAR */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-white font-bold text-xl shadow-md shadow-[#159a8c]/20">
              {getInitials(group.name)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a]">
                  {group.name}
                </h1>
                {group.isArchived && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
                {currentUserRole && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-medium capitalize">
                    {currentUserRole}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-stone-500 max-w-2xl leading-relaxed">
                {group.description || 'No description provided for this group.'}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS (Archive / Delete) */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            {/* ARCHIVE / REOPEN - OWNER ONLY */}
            {currentUserRole === 'owner' && (
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer shadow-xs"
              >
                {group.isArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 text-[#159a8c]" />
                    <span>Reopen</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 text-stone-500" />
                    <span>Archive</span>
                  </>
                )}
              </button>
            )}

            {/* DELETE - OWNER / ADMIN */}
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <button
                onClick={handleDeleteGroup}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100/70 transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================
            QUICK STATS & ACTIONS ROW
        ========================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CURRENCY CARD */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Base Currency
              </span>
              <Coins className="w-4 h-4 text-[#159a8c]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1a1a1a]">
                {group.baseCurrency || 'INR'}
              </span>
              <span className="text-xs text-stone-400">Default for splits</span>
            </div>
          </div>

          {/* MEMBERS COUNT */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total Members
              </span>
              <Users className="w-4 h-4 text-[#159a8c]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1a1a1a]">
                {group.members?.length || 0}
              </span>
              <span className="text-xs text-stone-400">People participating</span>
            </div>
          </div>

          {/* TRACK RECORD (EXPENSES) */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Track Record
              </span>
              <Receipt className="w-4 h-4 text-[#159a8c]" />
            </div>
            <button
              onClick={() => navigate(`/groups/${groupId}/expenses`)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-stone-100 hover:bg-stone-200/70 py-2 px-3 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
            >
              <span>View All Expenses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ADD EXPENSE CTA */}
          <div className="rounded-3xl border border-[#159a8c]/20 bg-gradient-to-br from-[#159a8c]/5 to-[#47c5b0]/10 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#159a8c]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#159a8c]">
                New Transaction
              </span>
              <Sparkles className="w-4 h-4 text-[#159a8c]" />
            </div>
            <button
              onClick={() => navigate(`/groups/${groupId}/expenses/add`)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] hover:bg-[#117d72] py-2 px-3 text-xs font-semibold text-white shadow-sm shadow-[#159a8c]/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>

        {/* =========================
            MEMBERS MANAGEMENT SECTION
        ========================= */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Group Roster</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Members</h2>
            </div>

            {/* ADD MEMBER FORM (OWNER / ADMIN ONLY) */}
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <form onSubmit={handleAddMember} className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <input
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    placeholder="Enter Profile ID"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#159a8c] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#117d72] transition-all disabled:opacity-60 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addingMember ? 'Adding...' : 'Add'}</span>
                </button>
              </form>
            )}
          </div>

          {/* MEMBER LIST */}
          <div className="mt-6 divide-y divide-stone-100">
            {group.members?.map((member) => {
              const memberUser = member.user || {}
              const memberUserId = memberUser._id || memberUser
              const isOwner = member.role === 'owner'
              const canManageMember =
                currentUserRole === 'owner' ||
                (currentUserRole === 'admin' && member.role === 'member')

              return (
                <div
                  key={member._id || memberUserId}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  {/* MEMBER DETAILS */}
                  <div className="flex items-center gap-3.5">
                    {memberUser.profileImage ? (
                      <img
                        src={memberUser.profileImage}
                        alt={memberUser.name || 'Member'}
                        className="h-10 w-10 rounded-2xl object-cover ring-1 ring-stone-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 font-bold text-xs">
                        {getInitials(memberUser.name)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1a1a1a]">
                          {memberUser.name || 'Unknown User'}
                        </p>
                        {memberUser._id === currentUserId && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#159a8c]/10 text-[#159a8c]">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">
                        {memberUser.email || 'No email provided'}
                      </p>
                    </div>
                  </div>

                  {/* CONTROLS */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* ROLE BADGE / SELECTOR */}
                    {canManageMember && currentUserRole === 'owner' && !isOwner ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(memberUser._id, e.target.value)
                        }
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 focus:border-[#159a8c] outline-none cursor-pointer transition-colors"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          isOwner
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : member.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {isOwner && <ShieldCheck className="w-3 h-3" />}
                        <span>{member.role}</span>
                      </span>
                    )}

                    {/* REMOVE MEMBER BUTTON */}
                    {canManageMember && !isOwner && (
                      <button
                        onClick={() =>
                          handleRemoveMember(memberUser._id, memberUser.name)
                        }
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove member"
                        aria-label={`Remove ${memberUser.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* =========================
            EDIT GROUP SETTINGS (OWNER / ADMIN ONLY)
        ========================= */}
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <Settings className="w-3.5 h-3.5" />
                <span>Configuration</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">
                Edit Group Settings
              </h2>
            </div>

            <form onSubmit={handleUpdateGroup} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* NAME */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Group Name
                  </label>
                  <input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Group name"
                    required
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Description
                  </label>
                  <input
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Short description"
                  />
                </div>

                {/* CURRENCY */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Base Currency
                  </label>
                  <select
                    value={editData.baseCurrency}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        baseCurrency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default ViewGroup

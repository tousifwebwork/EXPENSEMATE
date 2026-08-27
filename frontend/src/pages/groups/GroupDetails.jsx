import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../components/AppLayout.jsx'
import GroupHeader from '../../components/groups/GroupHeader.jsx'
import MemberList from '../../components/groups/MemberList.jsx'
import AddMemberModal from '../../components/groups/AddMemberModal.jsx'
import EditGroupModal from '../../components/groups/EditGroupModal.jsx'
import ConfirmDialog from '../../components/groups/ConfirmDialog.jsx'
import {
  addMember,
  archiveGroup,
  getGroup,
  removeMember,
  updateGroup,
  updateMemberRole,
} from '../../config/group/groupAPI.js'

const unwrapGroup = (response) =>
  response?.data?.group ||
  response?.data?.data ||
  response?.data

const memberIdOf = (member) =>
  member?._id ||
  member?.id ||
  member?.userId ||
  member?.memberId ||
  member?.profileId

const roleOf = (member) =>
  (member?.role || 'member').toLowerCase()

function GroupDetails() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [mutationLoading, setMutationLoading] = useState(false)

  const [confirm, setConfirm] = useState({
    open: false,
    type: '',
    member: null,
  })

  const loadGroup = async () => {
    setLoading(true)

    try {
      const response = await getGroup(groupId)
      setGroup(unwrapGroup(response))
      setPageError('')
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          'Unable to load this group.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroup()
  }, [groupId])

  const members = useMemo(
    () => group?.members || [],
    [group]
  )

  /*
    Backend may return currentUserRole directly.
    If not, we determine it from the member list / owner.
  */
  const currentUserRole = (
    group?.currentUserRole ||
    group?.userRole ||
    group?.role ||
    'member'
  ).toLowerCase()

  const isOwner =
    currentUserRole === 'owner'

  const isAdmin =
    currentUserRole === 'admin'

  const canEdit =
    isOwner || isAdmin

  const canManageMembers =
    isOwner || isAdmin

  const permission =
    currentUserRole || 'member'

  const handleAddMember = async (profileId) => {
    setMutationLoading(true)

    try {
      const response = await addMember(groupId, {
        profileId,
      })

      setGroup(unwrapGroup(response))

      setAddMemberOpen(false)

      toast.success('Member added successfully.')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not add member.'
      )
    } finally {
      setMutationLoading(false)
    }
  }

  const handleEditGroup = async (data) => {
    setMutationLoading(true)

    try {
      const response = await updateGroup(
        groupId,
        data
      )

      setGroup(unwrapGroup(response))
      setEditOpen(false)

      toast.success('Group updated successfully.')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not update group.'
      )
    } finally {
      setMutationLoading(false)
    }
  }

  const openRoleConfirmation = (member) => {
    if (!isOwner) return

    const currentRole = roleOf(member)

    if (currentRole === 'owner') {
      toast.error("You cannot change the owner's role.")
      return
    }

    setConfirm({
      open: true,
      type: 'role',
      member,
    })
  }

  const handleChangeRole = async () => {
    const member = confirm.member

    if (!member || !isOwner) return

    const currentRole = roleOf(member)

    const nextRole =
      currentRole === 'admin'
        ? 'member'
        : 'admin'

    setMutationLoading(true)

    try {
      const response = await updateMemberRole(
        groupId,
        memberIdOf(member),
        {
          role: nextRole,
        }
      )

      setGroup(unwrapGroup(response))

      setConfirm({
        open: false,
        type: '',
        member: null,
      })

      toast.success(
        nextRole === 'admin'
          ? 'Member promoted to admin.'
          : 'Admin role removed.'
      )
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not update member role.'
      )
    } finally {
      setMutationLoading(false)
    }
  }

  const openRemoveConfirmation = (member) => {
    const role = roleOf(member)

    if (role === 'owner') {
      toast.error("You cannot remove the group owner.")
      return
    }

    setConfirm({
      open: true,
      type: 'remove',
      member,
    })
  }

  const handleRemoveMember = async () => {
    const member = confirm.member

    if (!member) return

    setMutationLoading(true)

    try {
      const response = await removeMember(
        groupId,
        memberIdOf(member)
      )

      setGroup(unwrapGroup(response))

      setConfirm({
        open: false,
        type: '',
        member: null,
      })

      toast.success('Member removed.')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not remove member.'
      )
    } finally {
      setMutationLoading(false)
    }
  }

  const openArchiveConfirmation = () => {
    if (!isOwner) return

    const archived = Boolean(
      group?.isArchived ||
      group?.archived
    )

    setConfirm({
      open: true,
      type: archived ? 'reopen' : 'archive',
      member: null,
    })
  }

  const handleArchive = async () => {
    setMutationLoading(true)

    try {
      const response = await archiveGroup(groupId)

      setGroup(unwrapGroup(response))

      setConfirm({
        open: false,
        type: '',
        member: null,
      })

      const archived =
        response?.data?.group?.isArchived ??
        response?.data?.data?.isArchived

      toast.success(
        archived === false
          ? 'Group reopened.'
          : 'Group archived.'
      )

      /*
        If backend does not include isArchived in the
        response, reload to get the latest state.
      */
      await loadGroup()
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not change group status.'
      )
    } finally {
      setMutationLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

          <div className="space-y-3">
            <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-96 animate-pulse rounded bg-slate-200" />
          </div>

          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </AppLayout>
    )
  }

  if (pageError || !group) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <p className="font-semibold text-red-700">
            {pageError || 'Group not found.'}
          </p>

          <button
            onClick={() => navigate('/groups')}
            className="mt-4 font-bold text-red-700 underline"
          >
            Back to Groups
          </button>

        </div>
      </AppLayout>
    )
  }

  const archived = Boolean(
    group.isArchived ||
    group.archived
  )

  let confirmTitle = ''
  let confirmMessage = ''
  let confirmText = 'Confirm'
  let danger = false
  let confirmAction = null

  if (confirm.type === 'role') {
    const currentRole = roleOf(confirm.member)

    const nextRole =
      currentRole === 'admin'
        ? 'member'
        : 'admin'

    confirmTitle =
      nextRole === 'admin'
        ? 'Make Admin?'
        : 'Remove Admin Role?'

    confirmMessage =
      nextRole === 'admin'
        ? `Give ${confirm.member?.name || confirm.member?.email || 'this member'} admin permissions?`
        : `Remove admin permissions from ${confirm.member?.name || confirm.member?.email || 'this member'}?`

    confirmText =
      nextRole === 'admin'
        ? 'Make Admin'
        : 'Remove Admin Role'

    confirmAction = handleChangeRole
  }

  if (confirm.type === 'remove') {
    confirmTitle = 'Remove Member?'

    confirmMessage =
      `Remove ${
        confirm.member?.name ||
        confirm.member?.email ||
        'this member'
      } from this group?`

    confirmText = 'Remove'
    danger = true
    confirmAction = handleRemoveMember
  }

  if (confirm.type === 'archive') {
    confirmTitle = 'Archive Group?'
    confirmMessage =
      'Archive this group? You can reopen it later.'
    confirmText = 'Archive Group'
    danger = true
    confirmAction = handleArchive
  }

  if (confirm.type === 'reopen') {
    confirmTitle = 'Reopen Group?'
    confirmMessage =
      'Reopen this group and make it active again.'
    confirmText = 'Reopen Group'
    confirmAction = handleArchive
  }

  return (
    <AppLayout>

      <Link
        to="/groups"
        className="text-sm font-bold text-[#117d72] hover:text-[#102a43]"
      >
        ← All Groups
      </Link>

      <GroupHeader
        group={group}
        permission={permission}
        canEdit={canEdit}
        isOwner={isOwner}
        onEdit={() => setEditOpen(true)}
        onArchive={openArchiveConfirmation}
      />

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">

          <div>
            <h2 className="text-xl font-bold text-[#102a43]">
              Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {members.length}{' '}
              {members.length === 1
                ? 'person'
                : 'people'}{' '}
              in this group
            </p>
          </div>

          {canManageMembers && !archived && (
            <button
              onClick={() => setAddMemberOpen(true)}
              className="rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#117d72]"
            >
              + Add Member
            </button>
          )}

        </div>

        <MemberList
          members={members}
          isOwner={isOwner}
          canManageMembers={canManageMembers}
          onChangeRole={openRoleConfirmation}
          onRemove={openRemoveConfirmation}
        />

      </section>

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onSubmit={handleAddMember}
        loading={mutationLoading}
      />

      <EditGroupModal
        open={editOpen}
        group={group}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditGroup}
        loading={mutationLoading}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        danger={danger}
        loading={mutationLoading}
        onConfirm={confirmAction}
        onCancel={() =>
          !mutationLoading &&
          setConfirm({
            open: false,
            type: '',
            member: null,
          })
        }
      />

    </AppLayout>
  )
}

export default GroupDetails

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../components/AppLayout.jsx'
import GroupForm from '../../components/groups/GroupForm.jsx'
import { createGroup } from '../../config/group/groupAPI.js'

const unwrapGroup = (response) =>
  response?.data?.group ||
  response?.data?.data ||
  response?.data

function CreateGroup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleCreate = async (data) => {
    setLoading(true)

    try {
      const response = await createGroup(data)
      const group = unwrapGroup(response)

      toast.success('Group created successfully!')

      const groupId =
        group?._id ||
        group?.id ||
        group?.groupId

      if (groupId) {
        navigate(`/groups/${groupId}`)
      } else {
        navigate('/groups')
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not create the group.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>

      <Link
        to="/groups"
        className="text-sm font-bold text-[#117d72] hover:text-[#102a43]"
      >
        ? All groups
      </Link>

      <div className="mt-5 max-w-3xl">

        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
          New group
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102a43]">
          Create a group
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Create a shared space for tracking expenses, balances,
          and settlements.
        </p>

      </div>

      <div className="mt-8 max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <GroupForm
          onSubmit={handleCreate}
          submitText="Create Group"
          loading={loading}
        />

      </div>

    </AppLayout>
  )
}

export default CreateGroup

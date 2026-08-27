import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../components/AppLayout.jsx'
import GroupCard from '../../components/groups/GroupCard.jsx'
import { getMyGroups } from '../../config/group/groupAPI.js'

const unwrapGroups = (response) => {
  const data = response?.data

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.groups)) return data.groups
  if (Array.isArray(data?.data)) return data.data

  return []
}

function GroupSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-10 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  )
}

function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadGroups = async () => {
    setLoading(true)

    try {
      const response = await getMyGroups()
      setGroups(unwrapGroups(response))
      setError('')
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        'Unable to load your groups.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return groups

    return groups.filter((group) => {
      return (
        group.name?.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query) ||
        group.baseCurrency?.toLowerCase().includes(query)
      )
    })
  }, [groups, search])

  const activeGroups = filteredGroups.filter(
    (group) => !(group.isArchived || group.archived)
  )

  const archivedGroups = filteredGroups.filter(
    (group) => group.isArchived || group.archived
  )

  return (
    <AppLayout>

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
            ExpenseMate
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">
            My Groups
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage shared expenses and members across your groups.
          </p>
        </div>

        <Link
          to="/groups/create"
          className="inline-flex items-center justify-center rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 hover:bg-[#117d72]"
        >
          + Create Group
        </Link>

      </div>

      <div className="mt-8">

        <div className="relative max-w-xl">
          <input
            type="search"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm text-slate-900 outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10"
          />

          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            ??
          </span>
        </div>

      </div>

      {loading && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <GroupSkeleton />
          <GroupSkeleton />
          <GroupSkeleton />
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <p className="font-semibold text-red-700">
            {error}
          </p>

          <button
            onClick={() => {
              loadGroups()
              toast.success('Retrying...')
            }}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Try Again
          </button>

        </div>
      )}

      {!loading && !error && filteredGroups.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#e6f8f4] text-2xl">
            ??
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#102a43]">
            {search ? 'No groups found' : 'You have no groups yet'}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search
              ? 'Try another search term.'
              : 'Create your first group to start sharing expenses with friends, family, or teammates.'}
          </p>

          {!search && (
            <Link
              to="/groups/create"
              className="mt-6 inline-flex rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-bold text-white hover:bg-[#117d72]"
            >
              Create Your First Group
            </Link>
          )}

        </div>
      )}

      {!loading && !error && activeGroups.length > 0 && (
        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#102a43]">
                Active Groups
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {activeGroups.length}{' '}
                {activeGroups.length === 1 ? 'group' : 'groups'}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeGroups.map((group) => (
              <GroupCard
                key={group._id || group.id || group.groupId}
                group={group}
              />
            ))}
          </div>

        </section>
      )}

      {!loading && !error && archivedGroups.length > 0 && (
        <section className="mt-10">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#102a43]">
              Archived Groups
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Groups that are no longer active.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {archivedGroups.map((group) => (
              <GroupCard
                key={group._id || group.id || group.groupId}
                group={group}
              />
            ))}
          </div>

        </section>
      )}

    </AppLayout>
  )
}

export default Groups

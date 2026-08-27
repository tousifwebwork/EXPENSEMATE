import { Link } from 'react-router-dom'

function GroupCard({ group }) {
  const groupId = group._id || group.id || group.groupId

  const members = group.members || []
  const memberCount =
    group.memberCount ??
    group.membersCount ??
    members.length

  const owner =
    group.owner?.name ||
    group.owner?.email ||
    group.ownerName ||
    'Group owner'

  const archived = Boolean(group.isArchived || group.archived)

  const createdDate = group.createdAt
    ? new Date(group.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <Link
      to={`/groups/${groupId}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#159a8c] hover:shadow-lg"
    >
      <div className="relative h-44 bg-[#e6f8f4]">

        {group.coverImage ? (
          <img
            src={group.coverImage}
            alt={`${group.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="text-6xl font-black text-[#159a8c]/30">
              {(group.name || 'G').slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
            archived
              ? 'bg-slate-100 text-slate-600'
              : 'bg-white text-[#117d72]'
          }`}
        >
          {archived ? 'Archived' : 'Active'}
        </span>
      </div>

      <div className="p-5">

        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-[#102a43]">
            {group.name}
          </h2>

          <span className="rounded-lg bg-[#e6f8f4] px-2.5 py-1 text-xs font-bold text-[#117d72]">
            {group.baseCurrency || 'INR'}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
          {group.description || 'Shared expenses and balances for this group.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Members
            </p>
            <p className="mt-1 text-sm font-bold text-[#102a43]">
              {memberCount}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Owner
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[#102a43]">
              {owner}
            </p>
          </div>

        </div>

        {createdDate && (
          <p className="mt-4 text-xs text-slate-400">
            Created {createdDate}
          </p>
        )}

      </div>
    </Link>
  )
}

export default GroupCard

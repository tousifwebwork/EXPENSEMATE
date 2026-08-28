import RoleBadge from './RoleBadge'

function GroupHeader({
  group,
  permission,
  canEdit,
  isOwner,
  onEdit,
  onArchive,
}) {
  const archived = Boolean(group.isArchived || group.archived)

  return (
    <>
      {group.coverImage && (
        <img
          src={group.coverImage}
          alt={`${group.name} cover`}
          className="mt-5 h-56 w-full rounded-2xl object-cover"
        />
      )}

      <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

        <div className="min-w-0">

          <div className="flex items-start gap-4">

            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#e6f8f4] text-2xl font-black text-[#117d72]">
              {(group.name || 'G').slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">

              <h1 className="break-words text-3xl font-bold tracking-tight text-[#102a43]">
                {group.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    archived
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-[#e6f8f4] text-[#117d72]'
                  }`}
                >
                  {archived ? 'Archived' : 'Active'}
                </span>

                <RoleBadge role={permission} />

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {group.baseCurrency || 'INR'}
                </span>

              </div>

            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-500">
            {group.description ||
              'Shared expenses and balances for this group.'}
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Owner:{' '}
            {group.owner?.name ||
              group.owner?.email ||
              group.ownerName ||
              'Group owner'}
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          {canEdit && (
            <button
              onClick={onEdit}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#102a43] hover:border-[#159a8c]"
            >
              Edit Group
            </button>
          )}

          {isOwner && (
            <button
              onClick={onArchive}
              className="rounded-xl bg-[#102a43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#183d5d]"
            >
              {archived ? 'Reopen Group' : 'Archive Group'}
            </button>
          )}

        </div>

      </div>
    </>
  )
}

export default GroupHeader

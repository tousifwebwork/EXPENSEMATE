import MemberCard from './MemberCard'

function MemberList({
  members,
  isOwner,
  canManageMembers,
  onChangeRole,
  onRemove,
}) {
  if (!members.length) {
    return (
      <div className="px-5 py-12 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-xl">
          ??
        </div>

        <p className="mt-4 text-sm font-bold text-[#102a43]">
          No members found
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Add members using their profile ID.
        </p>
      </div>
    )
  }

  return (
    <div>
      {members.map((member, index) => (
        <MemberCard
          key={
            member._id ||
            member.id ||
            member.userId ||
            member.memberId ||
            member.profileId ||
            index
          }
          member={member}
          isOwner={isOwner}
          canManageMembers={canManageMembers}
          onChangeRole={onChangeRole}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

export default MemberList

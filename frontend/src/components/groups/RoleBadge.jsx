function RoleBadge({ role }) {
  const normalizedRole = (role || 'member').toLowerCase()

  const styles = {
    owner: 'bg-amber-100 text-amber-800 border border-amber-200',
    admin: 'bg-blue-100 text-blue-800 border border-blue-200',
    member: 'bg-slate-100 text-slate-700 border border-slate-200',
  }

  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        styles[normalizedRole] || styles.member
      }`}
    >
      {labels[normalizedRole] || 'Member'}
    </span>
  )
}

export default RoleBadge

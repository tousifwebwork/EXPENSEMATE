export default function MemberCard({
  member,
  onRemove,
  canRemove = false,
}) {
  if (!member) return null;

  const name =
    member.name ||
    member.username ||
    member.fullName ||
    "Unknown Member";

  const email = member.email || "";

  const role = member.role || "member";

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
          {initials}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>

          {email && (
            <p className="text-sm text-gray-500">
              {email}
            </p>
          )}

          <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
            {role}
          </span>
        </div>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove?.(member)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Remove
        </button>
      )}
    </div>
  );
}
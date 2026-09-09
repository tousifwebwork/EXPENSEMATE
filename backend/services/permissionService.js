// Resolves a user's effective role for a given group and checks capabilities
// against the roles matrix in the requirements doc (section 3). Enforcement
// lives here — the backend, not the UI — per "Permissions must be enforced
// by the backend, not only hidden in the interface."

const ROLES = {
  PLATFORM_ADMIN: 'platformAdmin',
  GROUP_OWNER: 'groupOwner',
  GROUP_ADMIN: 'groupAdmin',
  GROUP_MEMBER: 'groupMember',
  NONE: 'none',
};

// Capability -> which roles may perform it. Mirrors the table exactly.
const CAPABILITIES = {
  MANAGE_APPLICATION_USERS: [ROLES.PLATFORM_ADMIN],
  CREATE_GROUP: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN, ROLES.GROUP_MEMBER], // any authenticated user
  EDIT_GROUP_DETAILS: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN],
  MANAGE_GROUP_MEMBERS: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN],
  PROMOTE_DEMOTE_GROUP_ADMINS: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER],
  ADD_EXPENSE: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN, ROLES.GROUP_MEMBER],
  EDIT_DELETE_OWN_EXPENSE: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN, ROLES.GROUP_MEMBER],
  EDIT_DELETE_ANY_EXPENSE: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN],
  RECORD_SETTLEMENT: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN, ROLES.GROUP_MEMBER],
  VIEW_GROUP_BALANCES_REPORTS: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER, ROLES.GROUP_ADMIN, ROLES.GROUP_MEMBER],
  ARCHIVE_GROUP: [ROLES.PLATFORM_ADMIN, ROLES.GROUP_OWNER],
};

/**
 * Determine a user's effective role in the context of a specific group.
 * Platform admins always resolve to PLATFORM_ADMIN regardless of group
 * membership, since they have Yes across the whole table.
 */
function resolveRole(user, group) {
  if (!user) return ROLES.NONE;
  if (user.platformRole === 'platformAdmin') return ROLES.PLATFORM_ADMIN;
  if (!group) return ROLES.NONE;

  const userId = user._id.toString();
  if (group.owner && group.owner.toString() === userId) return ROLES.GROUP_OWNER;
  if (group.admins && group.admins.some((id) => id.toString() === userId)) return ROLES.GROUP_ADMIN;
  if (group.members && group.members.some((id) => id.toString() === userId)) return ROLES.GROUP_MEMBER;
  return ROLES.NONE;
}

/**
 * Returns true if the resolved role for (user, group) is permitted to
 * perform the given capability.
 */
function can(user, group, capability) {
  const role = resolveRole(user, group);
  const allowedRoles = CAPABILITIES[capability];
  if (!allowedRoles) {
    throw new Error(`Unknown capability: ${capability}`);
  }
  return allowedRoles.includes(role);
}

/**
 * Express middleware factory. Requires req.group to already be loaded
 * (see requireGroupMembership) and req.user to be set (see protect).
 * Platform admins pass every check without needing group membership.
 */
function requireCapability(capability) {
  return (req, res, next) => {
    if (can(req.user, req.group, capability)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
  };
}

module.exports = {
  ROLES,
  CAPABILITIES,
  resolveRole,
  can,
  requireCapability,
};

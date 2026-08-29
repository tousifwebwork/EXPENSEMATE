

// Finds if a user belongs to a group, and returns their role
function getGroupMembership(group, userId) {
  return group.members.find((m) => m.user.toString() === userId.toString());
}

module.exports = getGroupMembership;
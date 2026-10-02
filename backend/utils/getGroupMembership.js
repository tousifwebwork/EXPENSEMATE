 
function getGroupMembership(group, userId) {
  return group.members.find((m) => {
    // If populated, m.user is a full document — use m.user._id
    // If not populated, m.user is already the raw ObjectId
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });
}
module.exports = getGroupMembership;
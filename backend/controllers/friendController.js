const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
  };
}

async function searchUsers(req, res) {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }],
    })
      .select('name email phone profileImage')
      .limit(20);

    return res.json({ success: true, users: users.map(publicUser) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to search users' });
  }
}

async function sendFriendRequest(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Target user is required' });
    }
    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check both directions for an existing non-terminal relationship
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, message: 'You are already friends with this user' });
      }
      if (existing.status === 'pending') {
        // If the other user already sent us a request, sending one back should just accept it.
        if (existing.sender.toString() === userId.toString()) {
          existing.status = 'accepted';
          await existing.save();
          await Notification.create({
            recipient: userId,
            type: 'friend_request_accepted',
            relatedEntity: existing._id,
            relatedModel: 'FriendRequest',
            message: `${req.user.name} accepted your friend request`,
          });
          return res.json({ success: true, message: 'Friend request accepted', friendRequest: existing });
        }
        return res.status(409).json({ success: false, message: 'Friend request already exists' });
      }
      // Previously declined/cancelled: reuse the document, reset it as a fresh pending request from us.
      existing.sender = req.user._id;
      existing.receiver = userId;
      existing.status = 'pending';
      await existing.save();
      return res.status(201).json({ success: true, friendRequest: existing });
    }

    const friendRequest = await FriendRequest.create({
      sender: req.user._id,
      receiver: userId,
      status: 'pending',
    });

    await Notification.create({
      recipient: userId,
      type: 'friend_request_received',
      relatedEntity: friendRequest._id,
      relatedModel: 'FriendRequest',
      message: `${req.user.name} sent you a friend request`,
    });

    return res.status(201).json({ success: true, friendRequest });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Friend request already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
}

async function respondToFriendRequest(req, res) {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or decline' });
    }

    const friendRequest = await FriendRequest.findById(req.params.id);
    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to respond to this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This friend request is no longer pending' });
    }

    friendRequest.status = action === 'accept' ? 'accepted' : 'declined';
    await friendRequest.save();

    await Notification.create({
      recipient: friendRequest.sender,
      type: `friend_request_${action}ed`,
      relatedEntity: friendRequest._id,
      relatedModel: 'FriendRequest',
      message: `${req.user.name} ${action}ed your friend request`,
    });

    return res.json({ success: true, friendRequest });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to respond to friend request' });
  }
}

async function cancelFriendRequest(req, res) {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);
    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    if (friendRequest.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This friend request is no longer pending' });
    }

    friendRequest.status = 'cancelled';
    await friendRequest.save();

    return res.json({ success: true, message: 'Friend request cancelled' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel friend request' });
  }
}

async function listPendingRequests(req, res) {
  try {
    const incoming = await FriendRequest.find({ receiver: req.user._id, status: 'pending' }).populate(
      'sender',
      'name email phone profileImage',
    );
    const outgoing = await FriendRequest.find({ sender: req.user._id, status: 'pending' }).populate(
      'receiver',
      'name email phone profileImage',
    );

    return res.json({ success: true, incoming, outgoing });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
  }
}

async function listFriends(req, res) {
  try {
    const { q = '' } = req.query;

    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).populate('sender receiver', 'name email phone profileImage');

    let friends = accepted.map((fr) => {
      const friend = fr.sender._id.toString() === req.user._id.toString() ? fr.receiver : fr.sender;
      return { ...publicUser(friend), friendshipId: fr._id };
    });

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      friends = friends.filter(
        (friend) => friend.name.toLowerCase().includes(needle) || friend.email.toLowerCase().includes(needle),
      );
    }

    return res.json({ success: true, friends });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
}

async function removeFriend(req, res) {
  try {
    const { friendshipId } = req.params;

    const friendRequest = await FriendRequest.findById(friendshipId);
    if (!friendRequest || friendRequest.status !== 'accepted') {
      return res.status(404).json({ success: false, message: 'Friendship not found' });
    }

    const isParty =
      friendRequest.sender.toString() === req.user._id.toString() ||
      friendRequest.receiver.toString() === req.user._id.toString();
    if (!isParty) {
      return res.status(403).json({ success: false, message: 'You are not part of this friendship' });
    }

    // Historical expense/settlement records reference Users directly, not this
    // FriendRequest document, so deleting the friendship record here does not
    // erase any shared expense history.
    await FriendRequest.deleteOne({ _id: friendRequest._id });

    return res.json({ success: true, message: 'Friend removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
}

module.exports = {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  listPendingRequests,
  listFriends,
  removeFriend,
};

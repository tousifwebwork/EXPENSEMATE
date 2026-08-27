const FriendRequest = require("../../model/friendRequestModel");
const User = require("../../model/userModel");

 
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.userId;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const trimmedQuery = query.trim();

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: trimmedQuery, $options: "i" } },
        { email: { $regex: trimmedQuery, $options: "i" } },
      ],
    })
      .select("name email profileId profileImage")
      .limit(20);

    if (users.length === 0) {
      return res.status(200).json({ success: true, users: [] });
    }

    const userIds = users.map((u) => u._id);

    // Fetch every request (any status) between the current user and any
    // of the found users, in either direction, in a single query.
    const requests = await FriendRequest.find({
      $or: [
        { sender: userId, receiver: { $in: userIds } },
        { receiver: userId, sender: { $in: userIds } },
      ],
    });

    const relationshipByUserId = new Map();
    requests.forEach((r) => {
      const isSender = r.sender.toString() === userId;
      const otherId = isSender ? r.receiver.toString() : r.sender.toString();

      if (r.status === "accepted") {
        relationshipByUserId.set(otherId, { status: "friends", requestId: r._id.toString() });
      } else if (r.status === "pending") {
        relationshipByUserId.set(otherId, {
          status: isSender ? "pending_sent" : "pending_received",
          requestId: r._id.toString(),
        });
      }
      // declined -> intentionally not stored, so it resolves to "none" below
    });

    const usersWithRelationship = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      profileId: u.profileId,
      profileImage: u.profileImage,
      relationship: relationshipByUserId.get(u._id.toString()) || { status: "none", requestId: null },
    }));

    res.status(200).json({ success: true, users: usersWithRelationship });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

 
exports.sendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ success: false, message: "profileId is required" });
    }

    const receiver = await User.findOne({ profileId: profileId.toUpperCase() });
    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (receiver._id.toString() === senderId) {
      return res.status(400).json({ success: false, message: "You cannot send a request to yourself" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiver._id },
        { sender: receiver._id, receiver: senderId },
      ],
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ success: false, message: "Friend request already pending" });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ success: false, message: "You are already friends" });
      }

      // status === "declined" -> allow resending by resetting the same document
      existing.sender = senderId;
      existing.receiver = receiver._id;
      existing.status = "pending";
      await existing.save();

      return res.status(201).json({ success: true, message: "Friend request sent", request: existing });
    }

    const request = await FriendRequest.create({ sender: senderId, receiver: receiver._id });

    res.status(201).json({ success: true, message: "Friend request sent", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" or "decline"
    const userId = req.user.userId;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to respond to this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request already responded to" });
    }

    request.status = action === "accept" ? "accepted" : "declined";
    await request.save();

    res.status(200).json({ success: true, message: `Request ${request.status}`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// CANCEL REQUEST (sender cancels their own pending request)
exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending requests can be cancelled" });
    }

    await request.deleteOne();

    res.status(200).json({ success: true, message: "Friend request cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// LIST PENDING REQUESTS (incoming + outgoing)
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const incoming = await FriendRequest.find({ receiver: userId, status: "pending" })
      .populate("sender", "name email profileImage");

    const outgoing = await FriendRequest.find({ sender: userId, status: "pending" })
      .populate("receiver", "name email profileImage");

    res.status(200).json({ success: true, incoming, outgoing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// LIST FRIENDS (accepted requests, either direction)
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await FriendRequest.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name email profileImage")
      .populate("receiver", "name email profileImage");

    // Normalize: return the "other person" in each request, not sender/receiver split
    const friends = requests.map((r) =>
      r.sender._id.toString() === userId ? r.receiver : r.sender
    );

    res.status(200).json({ success: true, friends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// REMOVE FRIEND (delete the accepted request)
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    const request = await FriendRequest.findOneAndDelete({
      status: "accepted",
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Friendship not found" });
    }

    res.status(200).json({ success: true, message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

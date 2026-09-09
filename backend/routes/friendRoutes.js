const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  listPendingRequests,
  listFriends,
  removeFriend,
} = require('../controllers/friendController');

const router = express.Router();

router.use(protect);

router.get('/users/search', searchUsers);
router.post('/friend-requests', sendFriendRequest);
router.put('/friend-requests/:id/respond', respondToFriendRequest);
router.delete('/friend-requests/:id', cancelFriendRequest);
router.get('/friend-requests', listPendingRequests);
router.get('/friends', listFriends);
router.delete('/friends/:friendshipId', removeFriend);

module.exports = router;

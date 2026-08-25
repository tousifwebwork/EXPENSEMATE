const express = require("express");
const router = express.Router();

const {protect} = require("../../middleware/authMiddleware");
const {searchUsers,sendRequest,respondToRequest,cancelRequest,getPendingRequests,getFriends,removeFriend,} = require("../../controller/friend/friendController");

router.get("/search", protect, searchUsers);
router.post("/request", protect, sendRequest);
router.patch("/request/:requestId", protect, respondToRequest);
router.delete("/request/:requestId", protect, cancelRequest);
router.get("/requests/pending", protect, getPendingRequests);
router.get("/", protect, getFriends);
router.delete("/:friendId", protect, removeFriend);
module.exports = router;
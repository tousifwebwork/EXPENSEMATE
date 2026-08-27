const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const groupController = require("../../controller/group/groupController");

router.post("/", protect, groupController.createGroup);
router.get("/", protect, groupController.getMyGroups);
router.get("/:groupId", protect, groupController.getGroupById);
router.patch("/:groupId", protect, groupController.updateGroup);
router.post("/:groupId/members", protect, groupController.addMember);
router.patch("/:groupId/members/:memberId/role", protect, groupController.updateMemberRole);
router.delete("/:groupId/members/:memberId", protect, groupController.removeMember);
router.patch("/:groupId/archive", protect, groupController.toggleArchive);

module.exports = router;
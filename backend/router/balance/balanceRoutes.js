const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const balanceController = require("../../controller/balance/balanceController");

router.get("/group/:groupId", protect, balanceController.getGroupBalances);
router.get("/group/:groupId/suggestions", protect, balanceController.getSettlementSuggestions);

module.exports = router;
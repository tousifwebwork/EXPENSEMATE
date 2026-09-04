const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const settlementController = require("../../controller/settlement/settlementController");

router.post("/", protect, settlementController.createSettlement);
router.get("/group/:groupId", protect, settlementController.getGroupSettlements);
router.patch("/:settlementId", protect, settlementController.updateSettlement);
router.delete("/:settlementId", protect, settlementController.deleteSettlement);

module.exports = router;
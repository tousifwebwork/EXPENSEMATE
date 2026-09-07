const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const reportController = require("../../controller/report/reportController");

router.get("/group/:groupId/expenses", protect, reportController.getExpenseReport);
router.get("/group/:groupId/settlements", protect, reportController.getSettlementReport);
router.get("/group/:groupId/expenses/export", protect, reportController.exportExpensesCSV);

module.exports = router;
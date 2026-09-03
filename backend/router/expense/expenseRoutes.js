const express = require("express");
const router = express.Router();
const {protect} = require("../../middleware/authMiddleware");
const expenseController = require("../../controller/expense/expenseController");
const upload = require("../../middleware/upload");

router.post("/", protect, upload.single("receiptPhoto"), expenseController.createExpense);
router.get("/group/:groupId", protect, expenseController.getGroupExpenses);
router.get("/:expenseId", protect, expenseController.getExpenseById);
router.patch("/:expenseId", protect,upload.single("receiptPhoto"), expenseController.updateExpense);
router.delete("/:expenseId", protect, expenseController.deleteExpense);

module.exports = router;
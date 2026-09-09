const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createExpense,
  listExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

router.use(protect);

router.post('/groups/:groupId/expenses', createExpense);
router.get('/groups/:groupId/expenses', listExpenses);
router.get('/expenses/:id', getExpenseById);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

module.exports = router;

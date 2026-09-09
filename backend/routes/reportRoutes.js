const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getSummary } = require('../controllers/reportController');

const router = express.Router();
router.use(protect);
router.get('/summary', getSummary);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createSettlement, listSettlements, updateSettlement, deleteSettlement } = require('../controllers/settlementController');

const router = express.Router();

router.use(protect);

router.post('/groups/:groupId/settlements', createSettlement);
router.get('/groups/:groupId/settlements', listSettlements);
router.put('/settlements/:id', updateSettlement);
router.delete('/settlements/:id', deleteSettlement);

module.exports = router;

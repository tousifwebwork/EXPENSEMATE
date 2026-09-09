const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addMember,
  removeMember,
  setMemberAdminStatus,
  archiveGroup,
  getBalances,
} = require('../controllers/groupController');

const router = express.Router();

router.use(protect);
router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId/admin', setMemberAdminStatus);
router.put('/:id/archive', archiveGroup);
router.get('/:id/balances', getBalances);

module.exports = router;

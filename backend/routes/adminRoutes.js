const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { listUsers, setPlatformRole, setAccountStatus, bootstrapFirstAdmin } = require('../controllers/adminController');

const router = express.Router();

router.use(protect);

// Any authenticated user may call this, but it only succeeds while zero
// platform admins exist (see controller for details).
router.post('/admin/bootstrap', bootstrapFirstAdmin);

router.get('/admin/users', authorize('platformAdmin'), listUsers);
router.put('/admin/users/:userId/role', authorize('platformAdmin'), setPlatformRole);
router.put('/admin/users/:userId/status', authorize('platformAdmin'), setAccountStatus);

module.exports = router;

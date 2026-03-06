// routes/company.js
const router = require('express').Router();
const { authenticate, authorize, tenantGuard } = require('../middleware/auth');
const ctrl = require('../controllers/companyController');

const adminGuard = [authenticate, authorize('ADMIN', 'SUPER_ADMIN'), tenantGuard];

router.get('/',               ...adminGuard, ctrl.getCompany);
router.put('/',               ...adminGuard, ctrl.updateCompany);
router.get('/invites',        ...adminGuard, ctrl.getInvites);
router.delete('/invites/:id', ...adminGuard, ctrl.revokeInvite);

module.exports = router;

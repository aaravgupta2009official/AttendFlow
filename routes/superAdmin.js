// routes/superAdmin.js
const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/superAdminController');

const superGuard = [authenticate, authorize('SUPER_ADMIN')];

router.get('/stats',                   ...superGuard, ctrl.getPlatformStats);
router.get('/companies',               ...superGuard, ctrl.getAllCompanies);
router.patch('/companies/:id/status',
  ...superGuard,
  body('status').isIn(['ACTIVE', 'SUSPENDED', 'TRIAL']).withMessage('Invalid status.'),
  validate,
  ctrl.updateCompanyStatus,
);
router.get('/users', ...superGuard, ctrl.getAllUsers);

module.exports = router;

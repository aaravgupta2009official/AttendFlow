// routes/employee.js
const router   = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize, tenantGuard } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/employeeController');

const guard = [authenticate, tenantGuard];
const adminGuard = [authenticate, authorize('ADMIN', 'SUPER_ADMIN'), tenantGuard];

router.get('/',             ...guard,       ctrl.getEmployees);
router.get('/departments',  ...guard,       ctrl.getDepartments);
router.get('/:id',          ...guard,       ctrl.getEmployee);
router.put('/:id',          ...adminGuard,  ctrl.updateEmployee);
router.delete('/:id',       ...adminGuard,  ctrl.deactivateEmployee);

router.post('/invite',
  ...adminGuard,
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('role').optional().isIn(['EMPLOYEE', 'ADMIN']).withMessage('Role must be EMPLOYEE or ADMIN.'),
  validate,
  ctrl.inviteEmployee,
);

module.exports = router;

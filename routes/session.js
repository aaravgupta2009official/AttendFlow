// routes/session.js
const router   = require('express').Router();
const { body } = require('express-validator');
const { authenticate, tenantGuard } = require('../middleware/auth');
const { validate }                  = require('../middleware/validate');
const ctrl = require('../controllers/sessionController');

const guard = [authenticate, tenantGuard];

router.get('/today-stats', ...guard, ctrl.getTodayStats);
router.get('/my-status',   ...guard, ctrl.getMyStatus);
router.get('/',            ...guard, ctrl.getSessions);

router.post('/checkin',
  ...guard,
  body('location').optional().isIn(['OFFICE', 'WFH', 'OTHER']).withMessage('Invalid location.'),
  validate,
  ctrl.checkIn,
);

router.post('/checkout',
  ...guard,
  body('sessionId').optional().isUUID().withMessage('Invalid session ID.'),
  validate,
  ctrl.checkOut,
);

module.exports = router;

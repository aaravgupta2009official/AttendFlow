// routes/audit.js
const router = require('express').Router();
const { authenticate, authorize, tenantGuard } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), tenantGuard, getAuditLogs);

module.exports = router;

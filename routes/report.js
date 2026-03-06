// routes/report.js
const router = require('express').Router();
const { authenticate, authorize, tenantGuard } = require('../middleware/auth');
const { getAttendanceReport, exportCsv } = require('../controllers/reportController');

const adminGuard = [authenticate, authorize('ADMIN', 'SUPER_ADMIN'), tenantGuard];

router.get('/attendance',  ...adminGuard, getAttendanceReport);
router.get('/export/csv',  ...adminGuard, exportCsv);

module.exports = router;

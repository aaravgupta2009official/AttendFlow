// ============================================================
// controllers/reportController.js — Analytics + CSV Export
// ============================================================

const prisma  = require('../utils/prisma');
const { log } = require('../utils/auditLogger');

// ── GET /api/reports/attendance ──────────────────────────────
// Returns daily attendance breakdown for a date range
const getAttendanceReport = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { from, to, employeeId } = req.query;

    const startDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const endDate   = to   ? new Date(to)   : new Date();
    endDate.setHours(23, 59, 59, 999);

    const where = {
      companyId,
      checkIn: { gte: startDate, lte: endDate },
      ...(employeeId && { employeeId }),
    };

    const sessions = await prisma.session.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: { checkIn: 'asc' },
    });

    // Group by date for chart data
    const byDate = {};
    for (const s of sessions) {
      const dateKey = s.checkIn.toISOString().slice(0, 10);
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, office: 0, wfh: 0, other: 0, total: 0, totalMins: 0 };
      }
      const loc = s.location.toLowerCase();
      byDate[dateKey][loc]++;
      byDate[dateKey].total++;
      byDate[dateKey].totalMins += s.durationMins || 0;
    }

    // Summary by employee
    const byEmployee = {};
    for (const s of sessions) {
      const key = s.employee.id;
      if (!byEmployee[key]) {
        byEmployee[key] = {
          employeeId: s.employee.id,
          name:       `${s.employee.firstName} ${s.employee.lastName}`,
          department: s.employee.department,
          daysPresent: 0,
          totalMins:  0,
          sessions:   0,
        };
      }
      byEmployee[key].sessions++;
      byEmployee[key].totalMins  += s.durationMins || 0;
      // Count unique dates
      const dateStr = s.checkIn.toISOString().slice(0, 10);
      if (!byEmployee[key]._dates) byEmployee[key]._dates = new Set();
      byEmployee[key]._dates.add(dateStr);
      byEmployee[key].daysPresent = byEmployee[key]._dates.size;
    }

    // Clean up internal _dates sets
    const employeeSummary = Object.values(byEmployee).map(({ _dates, ...rest }) => ({
      ...rest,
      avgHoursPerDay: rest.daysPresent ? Math.round(rest.totalMins / rest.daysPresent / 60 * 10) / 10 : 0,
      totalHours:     Math.round(rest.totalMins / 60 * 10) / 10,
    }));

    res.json({
      dailyBreakdown: Object.values(byDate),
      employeeSummary,
      meta: {
        from: startDate.toISOString(),
        to:   endDate.toISOString(),
        totalSessions: sessions.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/reports/export/csv ──────────────────────────────
// Streams CSV download of session data
const exportCsv = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { from, to, employeeId } = req.query;

    const startDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const endDate   = to   ? new Date(to)   : new Date();
    endDate.setHours(23, 59, 59, 999);

    const sessions = await prisma.session.findMany({
      where: {
        companyId,
        checkIn: { gte: startDate, lte: endDate },
        ...(employeeId && { employeeId }),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: true, jobTitle: true },
        },
      },
      orderBy: { checkIn: 'desc' },
    });

    // Build CSV rows
    const headers = ['Employee', 'Department', 'Job Title', 'Date', 'Check In', 'Check Out', 'Duration (mins)', 'Location'];
    const rows = sessions.map((s) => [
      `${s.employee.firstName} ${s.employee.lastName}`,
      s.employee.department || '',
      s.employee.jobTitle   || '',
      s.checkIn.toISOString().slice(0, 10),
      s.checkIn.toISOString(),
      s.checkOut ? s.checkOut.toISOString() : 'Active',
      s.durationMins ?? '',
      s.location,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    await log({
      companyId,
      userId:     req.user.id,
      action:     'REPORT_EXPORTED',
      targetType: 'report',
      metadata:   { type: 'csv', from: startDate.toISOString(), to: endDate.toISOString(), rows: sessions.length },
      ipAddress:  req.ip,
    });

    const filename = `attendflow-report-${startDate.toISOString().slice(0, 10)}-to-${endDate.toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAttendanceReport, exportCsv };

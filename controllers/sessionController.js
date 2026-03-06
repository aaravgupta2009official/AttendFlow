// ============================================================
// controllers/sessionController.js
// ============================================================

const prisma  = require('../utils/prisma');
const { log } = require('../utils/auditLogger');
const { emitCheckIn, emitCheckOut } = require('../utils/socketHandlers');

// ── POST /api/sessions/checkin ───────────────────────────────
const checkIn = async (req, res, next) => {
  try {
    const { location = 'OFFICE', notes } = req.body;
    const companyId  = req.companyId;
    const employeeId = req.user.employee?.id;

    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile linked to this account.' });
    }

    // Prevent double check-in: reject if there is already an open session today
    const openSession = await prisma.session.findFirst({
      where: {
        companyId,
        employeeId,
        checkOut: null,
      },
    });
    if (openSession) {
      return res.status(409).json({
        error: 'You are already checked in.',
        sessionId: openSession.id,
      });
    }

    const session = await prisma.session.create({
      data: {
        companyId,
        employeeId,
        location,
        notes:     notes || null,
        ipAddress: req.ip,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarColor: true, department: true },
        },
      },
    });

    await log({
      companyId,
      userId:     req.user.id,
      action:     'CHECK_IN',
      targetType: 'session',
      targetId:   session.id,
      metadata:   { location },
      ipAddress:  req.ip,
    });

    // Emit real-time event to company admins
    emitCheckIn(req.io, companyId, {
      sessionId: session.id,
      employee:  session.employee,
      location:  session.location,
      checkIn:   session.checkIn,
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/sessions/checkout ──────────────────────────────
const checkOut = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const companyId     = req.companyId;
    const employeeId    = req.user.employee?.id;

    // Find the open session
    let session;
    if (sessionId) {
      session = await prisma.session.findFirst({ where: { id: sessionId, companyId, employeeId, checkOut: null } });
    } else {
      // Auto-find the latest open session for this employee
      session = await prisma.session.findFirst({
        where:   { companyId, employeeId, checkOut: null },
        orderBy: { checkIn: 'desc' },
      });
    }

    if (!session) {
      return res.status(404).json({ error: 'No active check-in found.' });
    }

    const now          = new Date();
    const diffMs       = now.getTime() - session.checkIn.getTime();
    const durationMins = Math.round(diffMs / 60000);

    const updated = await prisma.session.update({
      where: { id: session.id },
      data:  { checkOut: now, durationMins },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await log({
      companyId,
      userId:     req.user.id,
      action:     'CHECK_OUT',
      targetType: 'session',
      targetId:   session.id,
      metadata:   { durationMins, location: session.location },
      ipAddress:  req.ip,
    });

    emitCheckOut(req.io, companyId, {
      sessionId:   updated.id,
      employee:    updated.employee,
      durationMins: updated.durationMins,
      checkOut:    updated.checkOut,
    });

    res.json({ session: updated });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/sessions ─────────────────────────────────────────
// Admin: get all sessions for company; Employee: own sessions only
const getSessions = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const isAdmin   = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const {
      employeeId,
      from,
      to,
      location,
      status   = 'all',  // all | open | closed
      page     = 1,
      limit    = 25,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build date range filter
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const where = {
      companyId,
      // Non-admins can only see their own sessions
      ...(!isAdmin && { employeeId: req.user.employee?.id }),
      ...(isAdmin && employeeId && { employeeId }),
      ...(Object.keys(dateFilter).length && { checkIn: dateFilter }),
      ...(location && location !== 'all' && { location: location.toUpperCase() }),
      ...(status === 'open'   && { checkOut: null }),
      ...(status === 'closed' && { checkOut: { not: null } }),
    };

    const [sessions, total] = await prisma.$transaction([
      prisma.session.findMany({
        where,
        skip,
        take,
        orderBy: { checkIn: 'desc' },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, avatarColor: true, department: true },
          },
        },
      }),
      prisma.session.count({ where }),
    ]);

    res.json({
      sessions,
      pagination: {
        page:  parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/sessions/today-stats ────────────────────────────
// Dashboard stats: checked-in count, WFH count, absent, avg hours
const getTodayStats = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // All employees
    const totalEmployees = await prisma.employee.count({ where: { companyId, isActive: true } });

    // Open sessions right now (checked in, not out)
    const openSessions = await prisma.session.findMany({
      where: { companyId, checkOut: null, checkIn: { gte: startOfDay } },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarColor: true, department: true },
        },
      },
    });

    // All sessions today (for hours calc)
    const todaySessions = await prisma.session.findMany({
      where: {
        companyId,
        checkIn: { gte: startOfDay, lte: endOfDay },
      },
      select: { location: true, durationMins: true, checkOut: true },
    });

    const checkedInCount = openSessions.length;
    const wfhCount       = openSessions.filter((s) => s.location === 'WFH').length;
    const officeCount    = openSessions.filter((s) => s.location === 'OFFICE').length;
    const absentCount    = totalEmployees - checkedInCount;

    // Avg hours for sessions that have been closed today
    const closedToday = todaySessions.filter((s) => s.durationMins !== null);
    const totalMins   = closedToday.reduce((sum, s) => sum + (s.durationMins || 0), 0);
    const avgHours    = closedToday.length ? Math.round((totalMins / closedToday.length / 60) * 10) / 10 : 0;

    res.json({
      stats: {
        totalEmployees,
        checkedIn: checkedInCount,
        wfh:       wfhCount,
        office:    officeCount,
        absent:    absentCount > 0 ? absentCount : 0,
        avgHours,
      },
      liveEmployees: openSessions.map((s) => ({
        employeeId: s.employee.id,
        name:       `${s.employee.firstName} ${s.employee.lastName}`,
        avatarColor: s.employee.avatarColor,
        department: s.employee.department,
        location:   s.location,
        checkIn:    s.checkIn,
        sessionId:  s.id,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/sessions/my-status ──────────────────────────────
// For employee dashboard — returns current session state
const getMyStatus = async (req, res, next) => {
  try {
    const companyId  = req.companyId;
    const employeeId = req.user.employee?.id;

    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile.' });
    }

    const openSession = await prisma.session.findFirst({
      where:   { companyId, employeeId, checkOut: null },
      orderBy: { checkIn: 'desc' },
    });

    // Today's closed sessions for hours tracker
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayDone = await prisma.session.findMany({
      where: {
        companyId,
        employeeId,
        checkIn:  { gte: startOfDay },
        checkOut: { not: null },
      },
      select: { durationMins: true },
    });

    const totalMinsToday = todayDone.reduce((sum, s) => sum + (s.durationMins || 0), 0);

    // Streak: count consecutive days with at least one session
    // Look back up to 30 days
    const streak = await computeStreak(companyId, employeeId);

    res.json({
      isCheckedIn:   !!openSession,
      openSession,
      totalMinsToday,
      totalHoursToday: Math.round(totalMinsToday / 60 * 10) / 10,
      streak,
    });
  } catch (err) {
    next(err);
  }
};

// Helper: compute consecutive daily attendance streak
async function computeStreak(companyId, employeeId) {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    // Skip Saturdays (6) and Sundays (0)
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;

    const count = await prisma.session.count({
      where: {
        companyId,
        employeeId,
        checkIn: { gte: day, lte: dayEnd },
      },
    });

    if (count > 0) streak++;
    else break;
  }

  return streak;
}

module.exports = { checkIn, checkOut, getSessions, getTodayStats, getMyStatus };

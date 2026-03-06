// ============================================================
// controllers/employeeController.js
// ============================================================

const prisma  = require('../utils/prisma');
const { log } = require('../utils/auditLogger');
const { emitEmployeeUpdate } = require('../utils/socketHandlers');
const { sendInviteEmail } = require('../utils/email');

// ── GET /api/employees ────────────────────────────────────────
// Returns paginated, filtered employees for the authenticated company
const getEmployees = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const {
      search   = '',
      status   = 'all',   // all | active | inactive
      dept     = '',
      page     = 1,
      limit    = 20,
      sortBy   = 'lastName',
      sortDir  = 'asc',
    } = req.query;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const take  = parseInt(limit);

    // Build dynamic where clause
    const where = {
      companyId,
      ...(status === 'active'   && { isActive: true }),
      ...(status === 'inactive' && { isActive: false }),
      ...(dept   && { department: dept }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
          { jobTitle:  { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortDir },
        include: {
          user: { select: { id: true, email: true, role: true, lastLoginAt: true } },
          sessions: {
            where: {
              checkIn: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),  // today
              },
            },
            orderBy: { checkIn: 'desc' },
            take: 1,
            select: {
              id:       true,
              checkIn:  true,
              checkOut: true,
              location: true,
              durationMins: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    // Enrich each employee with today's status
    const enriched = employees.map((emp) => {
      const todaySession = emp.sessions[0] || null;
      let todayStatus = 'absent';
      if (todaySession) {
        todayStatus = todaySession.checkOut ? todaySession.location.toLowerCase() : 'active';
      }
      return {
        ...emp,
        todayStatus,
        todaySession,
        sessions: undefined, // remove raw sessions array
      };
    });

    res.json({
      employees: enriched,
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

// ── GET /api/employees/:id ────────────────────────────────────
const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        user: { select: { id: true, email: true, role: true, lastLoginAt: true, isActive: true } },
        sessions: {
          orderBy: { checkIn: 'desc' },
          take: 30,
          select: {
            id: true, checkIn: true, checkOut: true,
            location: true, durationMins: true, notes: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Compute stats
    const sessions = employee.sessions;
    const totalMins = sessions.reduce((sum, s) => sum + (s.durationMins || 0), 0);
    const avgMins   = sessions.length ? Math.round(totalMins / sessions.length) : 0;

    res.json({
      employee: {
        ...employee,
        stats: {
          totalSessions: sessions.length,
          totalHours:    Math.round(totalMins / 60 * 10) / 10,
          avgHoursPerDay: Math.round(avgMins / 60 * 10) / 10,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/employees/invite ────────────────────────────────
// Creates a pending invite record; real email would be sent here
const inviteEmployee = async (req, res, next) => {
  try {
    const { email, role = 'EMPLOYEE' } = req.body;
    const companyId = req.companyId;

    // Check seat limit
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { seats: true } });
    const currentCount = await prisma.employee.count({ where: { companyId, isActive: true } });
    if (currentCount >= company.seats) {
      return res.status(403).json({ error: 'Seat limit reached. Upgrade your plan to add more employees.' });
    }

    // Check duplicate invite
    const existing = await prisma.user.findFirst({ where: { email, companyId } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists in your company.' });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.upsert({
      where:  { companyId_email: { companyId, email } },
      update: { expiresAt, usedAt: null, role },
      create: { email, role, companyId, expiresAt },
    });

    await log({
      companyId,
      userId:     req.user.id,
      action:     'EMPLOYEE_INVITED',
      targetType: 'invite',
      targetId:   invite.id,
      metadata:   { email, role },
      ipAddress:  req.ip,
    });

    // Send invite email
    try {
      await sendInviteEmail({
        to:          email,
        token:       invite.token,
        companyName: req.user.company?.name || 'AttendFlow',
        role,
      });
    } catch (emailErr) {
      console.error('[Email] Failed to send invite email:', emailErr.message);
    }

    res.status(201).json({
      message: `Invite sent to ${email}`,
      invite: {
        id:        invite.id,
        email:     invite.email,
        role:      invite.role,
        expiresAt: invite.expiresAt,
        // In dev, expose token for testing
        ...(process.env.NODE_ENV === 'development' && { token: invite.token }),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/employees/:id ────────────────────────────────────
const updateEmployee = async (req, res, next) => {
  try {
    const { id }      = req.params;
    const companyId   = req.companyId;
    const { firstName, lastName, jobTitle, department, phone, avatarColor } = req.body;

    const employee = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName    !== undefined && { firstName }),
        ...(lastName     !== undefined && { lastName }),
        ...(jobTitle     !== undefined && { jobTitle }),
        ...(department   !== undefined && { department }),
        ...(phone        !== undefined && { phone }),
        ...(avatarColor  !== undefined && { avatarColor }),
      },
    });

    emitEmployeeUpdate(req.io, companyId, { type: 'updated', employee: updated });

    await log({
      companyId,
      userId:     req.user.id,
      action:     'SETTINGS_UPDATED',
      targetType: 'employee',
      targetId:   id,
      metadata:   { changes: req.body },
      ipAddress:  req.ip,
    });

    res.json({ employee: updated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/employees/:id ─────────────────────────────────
// Soft delete — sets isActive=false and deactivates user account
const deactivateEmployee = async (req, res, next) => {
  try {
    const { id }    = req.params;
    const companyId = req.companyId;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: { user: true },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({ where: { id }, data: { isActive: false } });
      if (employee.userId) {
        await tx.user.update({ where: { id: employee.userId }, data: { isActive: false } });
      }
    });

    await log({
      companyId,
      userId:     req.user.id,
      action:     'EMPLOYEE_REMOVED',
      targetType: 'employee',
      targetId:   id,
      metadata:   { name: `${employee.firstName} ${employee.lastName}` },
      ipAddress:  req.ip,
    });

    emitEmployeeUpdate(req.io, companyId, { type: 'deactivated', employeeId: id });

    res.json({ message: 'Employee deactivated.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/employees/departments ───────────────────────────
// Returns distinct departments for filter dropdowns
const getDepartments = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const result = await prisma.employee.findMany({
      where:   { companyId, isActive: true, department: { not: null } },
      select:  { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });
    res.json({ departments: result.map((r) => r.department) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  inviteEmployee,
  updateEmployee,
  deactivateEmployee,
  getDepartments,
};

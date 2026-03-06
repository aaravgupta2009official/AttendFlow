// ============================================================
// controllers/auditController.js
// ============================================================

const prisma = require('../utils/prisma');

// ── GET /api/audit ────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const {
      action,
      from,
      to,
      page  = 1,
      limit = 50,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const where = {
      companyId,
      ...(action && action !== 'all' && { action }),
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    };

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
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

module.exports = { getAuditLogs };

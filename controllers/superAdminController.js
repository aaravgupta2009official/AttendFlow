// ============================================================
// controllers/superAdminController.js — Platform-level access
// Only accessible by SUPER_ADMIN role
// ============================================================

const prisma = require('../utils/prisma');

// ── GET /api/super-admin/stats ───────────────────────────────
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalCompanies, totalUsers, totalSessions, subscriptions] = await prisma.$transaction([
      prisma.company.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.session.count(),
      prisma.subscription.findMany({
        select: { plan: true, priceMonthly: true, status: true },
      }),
    ]);

    const mrr = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.priceMonthly, 0);

    const planBreakdown = subscriptions.reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    }, {});

    res.json({
      stats: {
        totalCompanies,
        totalUsers,
        totalSessions,
        mrr,
        planBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/super-admin/companies ───────────────────────────
const getAllCompanies = async (req, res, next) => {
  try {
    const { search = '', plan, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      ...(plan   && plan   !== 'all' && { plan: plan.toUpperCase() }),
      ...(status && status !== 'all' && { status: status.toUpperCase() }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [companies, total] = await prisma.$transaction([
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: { select: { priceMonthly: true, status: true } },
          _count: {
            select: {
              employees: { where: { isActive: true } },
              sessions:  true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    res.json({
      companies,
      pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/super-admin/companies/:id/status ──────────────
const updateCompanyStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const valid = ['ACTIVE', 'SUSPENDED', 'TRIAL'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const updated = await prisma.company.update({
      where: { id },
      data:  { status },
    });

    res.json({ company: updated });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/super-admin/users ───────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { search = '', role, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      ...(role && role !== 'all' && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { employee: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName:  { contains: search, mode: 'insensitive' } },
            ],
          }},
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, role: true, isActive: true,
          lastLoginAt: true, createdAt: true,
          company:  { select: { id: true, name: true, plan: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlatformStats, getAllCompanies, updateCompanyStatus, getAllUsers };

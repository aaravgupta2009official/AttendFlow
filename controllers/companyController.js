// ============================================================
// controllers/companyController.js
// ============================================================

const prisma  = require('../utils/prisma');
const { log } = require('../utils/auditLogger');

// ── GET /api/company ─────────────────────────────────────────
const getCompany = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      include: {
        subscription: true,
        _count: {
          select: { employees: { where: { isActive: true } } },
        },
      },
    });
    if (!company) return res.status(404).json({ error: 'Company not found.' });
    res.json({ company });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/company ─────────────────────────────────────────
const updateCompany = async (req, res, next) => {
  try {
    const { name, timezone, workdayHours } = req.body;
    const companyId = req.companyId;

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(name          !== undefined && { name }),
        ...(timezone      !== undefined && { timezone }),
        ...(workdayHours  !== undefined && { workdayHours: parseInt(workdayHours) }),
      },
    });

    await log({
      companyId,
      userId:     req.user.id,
      action:     'SETTINGS_UPDATED',
      targetType: 'company',
      targetId:   companyId,
      metadata:   req.body,
      ipAddress:  req.ip,
    });

    res.json({ company: updated });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/company/invites ─────────────────────────────────
const getInvites = async (req, res, next) => {
  try {
    const invites = await prisma.invite.findMany({
      where:   { companyId: req.companyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invites });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/company/invites/:id ──────────────────────────
const revokeInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invite = await prisma.invite.findFirst({ where: { id, companyId: req.companyId } });
    if (!invite) return res.status(404).json({ error: 'Invite not found.' });
    await prisma.invite.delete({ where: { id } });
    res.json({ message: 'Invite revoked.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCompany, updateCompany, getInvites, revokeInvite };

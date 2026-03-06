// ============================================================
// middleware/auth.js — JWT verification + RBAC
// ============================================================

const jwt     = require('jsonwebtoken');
const prisma  = require('../utils/prisma');

// ── Verify JWT + attach user to req ─────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
      }
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Fetch user + company from DB (ensures user still active)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id:        true,
        email:     true,
        role:      true,
        isActive:  true,
        companyId: true,
        company: {
          select: { id: true, name: true, slug: true, plan: true, status: true },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarColor: true, department: true, jobTitle: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    // Company must be active (not suspended) unless SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN' && user.company?.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Company account is suspended.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Role guard factory ──────────────────────────────────────
// Usage: authorize('ADMIN', 'SUPER_ADMIN')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

// ── Tenant isolation guard ───────────────────────────────────
// Ensures a non-super-admin cannot access another company's data
// Attach companyId to req from JWT, then validate against route params
const tenantGuard = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next(); // super admin bypasses

  const requestedCompanyId =
    req.params.companyId || req.query.companyId || req.body.companyId;

  // If a companyId is explicitly requested, it must match the user's company
  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return res.status(403).json({ error: 'Cross-tenant access denied.' });
  }

  // Inject companyId into body/query so controllers don't need to worry
  req.companyId = req.user.companyId;
  next();
};

module.exports = { authenticate, authorize, tenantGuard };

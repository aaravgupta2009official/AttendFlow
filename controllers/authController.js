// ============================================================
// controllers/authController.js
// ============================================================

const bcrypt  = require('bcryptjs');
const prisma  = require('../utils/prisma');
const { signToken, buildPayload } = require('../utils/jwt');
const { log } = require('../utils/auditLogger');

// ── POST /api/auth/register ──────────────────────────────────
// Register a new company + admin user in one step (self-service signup)
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    // Build a URL-safe slug from company name
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure slug uniqueness by appending random suffix if needed
    let slug = baseSlug;
    const slugExists = await prisma.company.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create company + user + employee profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          plan:   'FREE',
          status: 'TRIAL',
          seats:  10,
        },
      });

      // Create subscription record (free tier)
      await tx.subscription.create({
        data: {
          companyId:     company.id,
          plan:          'FREE',
          status:        'active',
          seats:         10,
          priceMonthly:  0,
          billingEmail:  email,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role:      'ADMIN',
          companyId: company.id,
        },
      });

      const employee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          jobTitle:  'Administrator',
          department: 'Management',
          companyId: company.id,
          userId:    user.id,
        },
      });

      return { company, user, employee };
    });

    // Audit log (no userId yet since it's new, use the created user)
    await log({
      companyId:  result.company.id,
      userId:     result.user.id,
      action:     'LOGIN',
      targetType: 'company',
      targetId:   result.company.id,
      metadata:   { event: 'company_registered' },
      ipAddress:  req.ip,
    });

    const token = signToken(buildPayload(result.user));

    res.status(201).json({
      token,
      user: {
        id:        result.user.id,
        email:     result.user.email,
        role:      result.user.role,
        companyId: result.company.id,
        company:   { id: result.company.id, name: result.company.name, slug: result.company.slug, plan: result.company.plan },
        employee:  { id: result.employee.id, firstName: result.employee.firstName, lastName: result.employee.lastName },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company:  { select: { id: true, name: true, slug: true, plan: true, status: true } },
        employee: { select: { id: true, firstName: true, lastName: true, avatarColor: true, jobTitle: true, department: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    // Super admin has no company — skip company status check
    if (user.role !== 'SUPER_ADMIN' && user.company?.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Company account is suspended. Contact support.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    });

    if (user.companyId) {
      await log({
        companyId:  user.companyId,
        userId:     user.id,
        action:     'LOGIN',
        targetType: 'user',
        targetId:   user.id,
        ipAddress:  req.ip,
      });
    }

    const token = signToken(buildPayload(user));

    res.json({
      token,
      user: {
        id:        user.id,
        email:     user.email,
        role:      user.role,
        companyId: user.companyId,
        company:   user.company,
        employee:  user.employee,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────
// Returns full user profile for the authenticated user
const me = async (req, res, next) => {
  try {
    // req.user is already populated by authenticate middleware
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/accept-invite ─────────────────────────────
// Accept an invitation token and set password to complete signup
const acceptInvite = async (req, res, next) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invitation.' });
    }
    if (invite.usedAt) {
      return res.status(400).json({ error: 'This invitation has already been used.' });
    }
    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          role:      invite.role,
          companyId: invite.companyId,
        },
      });

      const employee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          companyId: invite.companyId,
          userId:    user.id,
        },
      });

      // Mark invite as used
      await tx.invite.update({
        where: { id: invite.id },
        data:  { usedAt: new Date() },
      });

      return { user, employee };
    });

    await log({
      companyId:  invite.companyId,
      userId:     result.user.id,
      action:     'EMPLOYEE_INVITED',
      targetType: 'user',
      targetId:   result.user.id,
      metadata:   { event: 'invite_accepted', email: invite.email },
      ipAddress:  req.ip,
    });

    const jwtToken = signToken(buildPayload(result.user));

    const company = await prisma.company.findUnique({
      where: { id: invite.companyId },
      select: { id: true, name: true, slug: true, plan: true },
    });

    res.status(201).json({
      token: jwtToken,
      user: {
        id:        result.user.id,
        email:     result.user.email,
        role:      result.user.role,
        companyId: invite.companyId,
        company,
        employee:  result.employee,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, acceptInvite };

// ============================================================
// SEED FILE — AttendFlow
// Creates demo data: 1 Super Admin, 2 Companies, Admins, Employees, Sessions
// Run: npx prisma db seed
// ============================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────

const hash = (pw) => bcrypt.hashSync(pw, 12);

function randomMins(minH, maxH) {
  return Math.floor((Math.random() * (maxH - minH) + minH) * 60);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);
  return d;
}

// ─── seed ──────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding AttendFlow database...');

  // ── 1. Super Admin ─────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@attendflow.io' },
    update: {},
    create: {
      email: 'super@attendflow.io',
      passwordHash: hash('SuperAdmin123!'),
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Super admin created:', superAdmin.email);

  // ── 2. Company A — Acme Corp (Pro) ─────────────────────────
  const acme = await prisma.company.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'PRO',
      status: 'ACTIVE',
      timezone: 'America/New_York',
      workdayHours: 8,
      seats: 100,
    },
  });

  await prisma.subscription.upsert({
    where: { companyId: acme.id },
    update: {},
    create: {
      companyId: acme.id,
      plan: 'PRO',
      status: 'active',
      seats: 100,
      priceMonthly: 49,
      billingEmail: 'billing@acme.com',
    },
  });

  // Acme Admin
  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'sarah@acme.com' },
    update: {},
    create: {
      email: 'sarah@acme.com',
      passwordHash: hash('Admin123!'),
      role: 'ADMIN',
      isActive: true,
      companyId: acme.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: acmeAdmin.id },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Chen',
      jobTitle: 'HR Manager',
      department: 'Human Resources',
      avatarColor: '#f59e0b',
      companyId: acme.id,
      userId: acmeAdmin.id,
    },
  });

  // Acme Employees
  const acmeEmployeeData = [
    { first: 'Marcus',   last: 'Lee',     title: 'Senior Engineer',    dept: 'Engineering',     color: '#06b6d4', email: 'marcus@acme.com' },
    { first: 'Keiko',    last: 'Tanaka',  title: 'Product Designer',   dept: 'Design',          color: '#10b981', email: 'keiko@acme.com' },
    { first: 'Sophie',   last: 'Müller',  title: 'Marketing Lead',     dept: 'Marketing',       color: '#8b5cf6', email: 'sophie@acme.com' },
    { first: 'James',    last: 'Okafor',  title: 'Backend Engineer',   dept: 'Engineering',     color: '#f97316', email: 'james@acme.com' },
    { first: 'Priya',    last: 'Sharma',  title: 'Data Analyst',       dept: 'Analytics',       color: '#ec4899', email: 'priya@acme.com' },
    { first: 'Liam',     last: 'Walsh',   title: 'DevOps Engineer',    dept: 'Engineering',     color: '#14b8a6', email: 'liam@acme.com' },
    { first: 'Amara',    last: 'Diallo',  title: 'UX Researcher',      dept: 'Design',          color: '#a78bfa', email: 'amara@acme.com' },
    { first: 'Chen',     last: 'Wei',     title: 'Frontend Engineer',  dept: 'Engineering',     color: '#fb923c', email: 'chen@acme.com' },
    { first: 'Elena',    last: 'Petrov',  title: 'Sales Manager',      dept: 'Sales',           color: '#34d399', email: 'elena@acme.com' },
    { first: 'Omar',     last: 'Hassan',  title: 'Support Engineer',   dept: 'Support',         color: '#60a5fa', email: 'omar@acme.com' },
  ];

  const acmeEmployees = [];
  for (const e of acmeEmployeeData) {
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email,
        passwordHash: hash('Employee123!'),
        role: 'EMPLOYEE',
        isActive: true,
        companyId: acme.id,
      },
    });

    const emp = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        firstName: e.first,
        lastName: e.last,
        jobTitle: e.title,
        department: e.dept,
        avatarColor: e.color,
        companyId: acme.id,
        userId: user.id,
      },
    });
    acmeEmployees.push(emp);
  }

  console.log(`✅ Acme Corp: ${acmeEmployees.length} employees created`);

  // Seed sessions (last 14 days) for Acme employees
  const locations = ['OFFICE', 'WFH', 'OTHER'];
  let sessionCount = 0;

  for (const emp of acmeEmployees) {
    for (let day = 13; day >= 0; day--) {
      // ~80% attendance rate
      if (Math.random() > 0.8) continue;

      const checkIn = daysAgo(day);
      const durationMins = randomMins(6, 9.5);
      const checkOut = new Date(checkIn.getTime() + durationMins * 60000);
      const location = locations[Math.floor(Math.random() * locations.length)];

      // Only today's sessions might be open (no checkout)
      const isOpen = day === 0 && Math.random() > 0.4;

      await prisma.session.create({
        data: {
          companyId: acme.id,
          employeeId: emp.id,
          checkIn,
          checkOut: isOpen ? null : checkOut,
          location,
          durationMins: isOpen ? null : durationMins,
        },
      });
      sessionCount++;
    }
  }

  console.log(`✅ Created ${sessionCount} sessions for Acme Corp`);

  // Seed audit logs for Acme
  const auditActions = [
    { action: 'LOGIN',             targetType: 'user',    meta: { ip: '192.168.1.1' } },
    { action: 'CHECK_IN',          targetType: 'session', meta: { location: 'OFFICE' } },
    { action: 'CHECK_OUT',         targetType: 'session', meta: { duration: 480 } },
    { action: 'EMPLOYEE_INVITED',  targetType: 'employee', meta: { email: 'new@acme.com' } },
    { action: 'SETTINGS_UPDATED',  targetType: 'company', meta: { field: 'workdayHours', old: 8, new: 9 } },
    { action: 'REPORT_EXPORTED',   targetType: 'report',  meta: { type: 'csv', range: '7d' } },
  ];

  for (const log of auditActions) {
    await prisma.auditLog.create({
      data: {
        companyId: acme.id,
        userId: acmeAdmin.id,
        action: log.action,
        targetType: log.targetType,
        metadata: log.meta,
        ipAddress: '192.168.1.1',
      },
    });
  }

  // ── 3. Company B — Nova Labs (Enterprise) ──────────────────
  const nova = await prisma.company.upsert({
    where: { slug: 'nova-labs' },
    update: {},
    create: {
      name: 'Nova Labs',
      slug: 'nova-labs',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      timezone: 'Europe/London',
      workdayHours: 8,
      seats: 500,
    },
  });

  await prisma.subscription.upsert({
    where: { companyId: nova.id },
    update: {},
    create: {
      companyId: nova.id,
      plan: 'ENTERPRISE',
      status: 'active',
      seats: 500,
      priceMonthly: 199,
      billingEmail: 'billing@novalabs.io',
    },
  });

  const novaAdmin = await prisma.user.upsert({
    where: { email: 'admin@novalabs.io' },
    update: {},
    create: {
      email: 'admin@novalabs.io',
      passwordHash: hash('Admin123!'),
      role: 'ADMIN',
      isActive: true,
      companyId: nova.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: novaAdmin.id },
    update: {},
    create: {
      firstName: 'Alex',
      lastName: 'Rivera',
      jobTitle: 'Operations Director',
      department: 'Operations',
      avatarColor: '#06b6d4',
      companyId: nova.id,
      userId: novaAdmin.id,
    },
  });

  // Nova Labs employee (demo login)
  const novaEmpUser = await prisma.user.upsert({
    where: { email: 'employee@novalabs.io' },
    update: {},
    create: {
      email: 'employee@novalabs.io',
      passwordHash: hash('Employee123!'),
      role: 'EMPLOYEE',
      isActive: true,
      companyId: nova.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: novaEmpUser.id },
    update: {},
    create: {
      firstName: 'Jordan',
      lastName: 'Kim',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      avatarColor: '#10b981',
      companyId: nova.id,
      userId: novaEmpUser.id,
    },
  });

  console.log('✅ Nova Labs seeded');

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin  → super@attendflow.io  / SuperAdmin123!');
  console.log('Admin        → sarah@acme.com       / Admin123!');
  console.log('Employee     → marcus@acme.com      / Employee123!');
  console.log('Admin 2      → admin@novalabs.io    / Admin123!');
  console.log('Employee 2   → employee@novalabs.io / Employee123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

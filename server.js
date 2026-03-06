// ============================================================
// server.js — AttendFlow API Entry Point
// Express + Socket.io + Prisma
// ============================================================

require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initSocketHandlers }     = require('./utils/socketHandlers');

// ── Route imports ───────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const companyRoutes    = require('./routes/company');
const employeeRoutes   = require('./routes/employee');
const sessionRoutes    = require('./routes/session');
const auditRoutes      = require('./routes/audit');
const reportRoutes     = require('./routes/report');
const superAdminRoutes = require('./routes/superAdmin');

// ── App + HTTP Server ───────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.io ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in req object via middleware
app.use((req, _res, next) => {
  req.io = io;
  next();
});

initSocketHandlers(io);

// ── Security Headers ────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ─────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Global Rate Limiter ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AttendFlow API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/company',     companyRoutes);
app.use('/api/employees',   employeeRoutes);
app.use('/api/sessions',    sessionRoutes);
app.use('/api/audit',       auditRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/super-admin', superAdminRoutes);

// ── 404 + Error Handler ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 AttendFlow API running on port ${PORT}`);
  console.log(`   Env:      ${process.env.NODE_ENV}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health`);
  console.log(`   Realtime: Socket.io enabled\n`);
});

module.exports = { app, server, io };

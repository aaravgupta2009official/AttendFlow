// ============================================================
// middleware/errorHandler.js — Centralized error handling
// ============================================================

const { Prisma } = require('@prisma/client');

// ── 404 handler ──────────────────────────────────────────────
const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Prisma known request errors (validation, unique constraint, not found)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        return res.status(409).json({
          error: 'A record with this value already exists.',
          field: err.meta?.target,
        });
      case 'P2025': // Record not found
        return res.status(404).json({ error: 'Record not found.' });
      case 'P2003': // Foreign key constraint
        return res.status(400).json({ error: 'Referenced record does not exist.' });
      default:
        return res.status(400).json({ error: 'Database error.', code: err.code });
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Invalid data provided.' });
  }

  // JWT errors (should already be caught in auth middleware, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }

  // Validation errors from express-validator (passed via next(errors))
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Validation failed.', details: err.errors });
  }

  // Known application errors (thrown with status)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Fallback — 500
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Internal server error.',
    ...(isDev && { message: err.message, stack: err.stack }),
  });
};

// ── App error factory ────────────────────────────────────────
const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = { notFound, errorHandler, createError };

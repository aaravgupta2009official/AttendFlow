// ============================================================
// utils/jwt.js — JWT helpers
// ============================================================

const jwt = require('jsonwebtoken');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

// Build the standard JWT payload from a user record
const buildPayload = (user) => ({
  userId:    user.id,
  email:     user.email,
  role:      user.role,
  companyId: user.companyId || null,
});

module.exports = { signToken, verifyToken, buildPayload };

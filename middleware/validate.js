// ============================================================
// middleware/validate.js — express-validator result handler
// ============================================================

const { validationResult } = require('express-validator');

// Run after validationChain[] and pass errors to error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.type = 'validation';
    err.errors = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));
    return next(err);
  }
  next();
};

module.exports = { validate };

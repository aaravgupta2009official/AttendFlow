// ============================================================
// routes/auth.js
// ============================================================

const router = require('express').Router();
const { body } = require('express-validator');

const { authenticate }              = require('../middleware/auth');
const { validate }                  = require('../middleware/validate');
const { register, login, me, acceptInvite } = require('../controllers/authController');

// ── Validation rules ─────────────────────────────────────────

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('firstName').trim().notEmpty().withMessage('First name required.'),
  body('lastName').trim().notEmpty().withMessage('Last name required.'),
  body('companyName').trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password required.'),
];

const acceptInviteRules = [
  body('token').notEmpty().withMessage('Invite token required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('firstName').trim().notEmpty().withMessage('First name required.'),
  body('lastName').trim().notEmpty().withMessage('Last name required.'),
];

// ── Routes ───────────────────────────────────────────────────

router.post('/register',       registerRules,      validate, register);
router.post('/login',          loginRules,         validate, login);
router.get( '/me',             authenticate,                 me);
router.post('/accept-invite',  acceptInviteRules,  validate, acceptInvite);

module.exports = router;

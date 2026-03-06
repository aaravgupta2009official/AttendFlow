// ============================================================
// utils/auditLogger.js — Creates audit log entries
// ============================================================

const prisma = require('./prisma');

/**
 * @param {object} opts
 * @param {string} opts.companyId
 * @param {string|null} opts.userId
 * @param {string} opts.action  — AuditAction enum value
 * @param {string} [opts.targetId]
 * @param {string} [opts.targetType]
 * @param {object} [opts.metadata]
 * @param {string} [opts.ipAddress]
 */
const log = async (opts) => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId:  opts.companyId,
        userId:     opts.userId   || null,
        action:     opts.action,
        targetId:   opts.targetId   || null,
        targetType: opts.targetType || null,
        metadata:   opts.metadata   || null,
        ipAddress:  opts.ipAddress  || null,
      },
    });
  } catch (err) {
    // Audit logging should never break primary operations
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
};

module.exports = { log };

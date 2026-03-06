// ============================================================
// utils/socketHandlers.js — Socket.io real-time layer
// Rooms are scoped per company: room = "company:{companyId}"
// ============================================================

const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Client joins its company room after authenticating
    socket.on('join:company', (companyId) => {
      if (!companyId) return;
      socket.join(`company:${companyId}`);
      console.log(`[Socket] ${socket.id} joined company:${companyId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${socket.id} disconnected`);
    });
  });
};

// ── Emit helpers (called from controllers) ──────────────────

// Broadcast check-in event to all admins in the company room
const emitCheckIn = (io, companyId, payload) => {
  io.to(`company:${companyId}`).emit('session:checkin', payload);
};

// Broadcast check-out event
const emitCheckOut = (io, companyId, payload) => {
  io.to(`company:${companyId}`).emit('session:checkout', payload);
};

// Broadcast when an employee is added or updated
const emitEmployeeUpdate = (io, companyId, payload) => {
  io.to(`company:${companyId}`).emit('employee:updated', payload);
};

// Broadcast a new audit log entry
const emitAuditLog = (io, companyId, payload) => {
  io.to(`company:${companyId}`).emit('audit:new', payload);
};

module.exports = {
  initSocketHandlers,
  emitCheckIn,
  emitCheckOut,
  emitEmployeeUpdate,
  emitAuditLog,
};

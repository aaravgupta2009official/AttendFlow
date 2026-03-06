// ============================================================
// services/socket.js — Socket.io client singleton
// ============================================================

import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
};

export const connectSocket = (companyId) => {
  const s = getSocket();
  s.connect();
  s.on('connect', () => {
    if (companyId) s.emit('join:company', companyId);
  });
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

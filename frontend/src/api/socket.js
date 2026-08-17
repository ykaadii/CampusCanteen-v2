import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://campuscanteen-v2-backend.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export function connectSocket(user) {
  if (!user) return;

  if (!socket.connected) {
    socket.connect();
  }

  // Join user room
  socket.emit("join:user", user.id);
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

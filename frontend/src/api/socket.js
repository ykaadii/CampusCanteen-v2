import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

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

  // If user is staff/admin, they can join staff rooms as needed
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

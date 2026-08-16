import { Server } from "socket.io";

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join:user", (userId) => socket.join(`user:${userId}`));
    socket.on("join:canteen", (canteenId) => socket.join(`canteen:${canteenId}`));
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized — call initSocket() first");
  return io;
}

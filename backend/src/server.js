import "dotenv/config";
import { createServer } from "http";
import { app } from "./app.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

// Socket.IO needs the raw HTTP server (not just the Express app) to
// attach its own upgrade/handshake handling for WebSocket connections.
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`CampusCanteen API running on http://localhost:${PORT}`);
});

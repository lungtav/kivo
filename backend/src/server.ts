import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./infrastructure/websocket/socket-server.js";
import { setSocketServer } from "./infrastructure/websocket/io.js";

const app = createApp();
const PORT = env.port ?? 5000;

const httpServer = http.createServer(app);

const io = createSocketServer(httpServer);
setSocketServer(io);
httpServer.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./infrastructure/websocket/socket-server.js";

const app = createApp();
const PORT = env.port ?? 5000;

const httpServer = http.createServer(app);

createSocketServer(httpServer);
httpServer.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

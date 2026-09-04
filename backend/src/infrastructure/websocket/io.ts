import type { Server } from "socket.io";

// shared handle so non-socket code paths (e.g. REST sends) can reach the rooms
let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

export const getSocketServer = () => io;

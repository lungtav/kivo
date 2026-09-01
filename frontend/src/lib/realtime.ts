import { io, type Socket } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_URL || undefined;
let socket: Socket | null = null;

export function connectRealtime() {
  const token = localStorage.getItem("kivo_access_token");
  if (!socket) {
    socket = io(socketUrl, { autoConnect: false, withCredentials: true, auth: { token } });
  }
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
}

export function getRealtimeSocket() {
  return socket;
}

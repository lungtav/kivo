import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const wsAuth = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("unauthorized access"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET_KEY);
    socket.data.userId = payload.sub;
    next();
  } catch (error) {
    next(new Error("unauthorized access"));
  }
};

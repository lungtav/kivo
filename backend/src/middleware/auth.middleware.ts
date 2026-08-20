import type { Request, Response, NextFunction } from "express";
import { UnauthoriedError } from "../shared/errors/UnauthorizedError.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthoriedError("missing or invalid header");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthoriedError("missing token");
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET_KEY);

    if (typeof payload === "string" || !payload.sub) {
      throw new UnauthoriedError("invalid token");
    }

    req.user = { id: payload.sub };

    next();
  } catch (error) {
    throw new UnauthoriedError("invalid token");
  }
};

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError.js";

export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      `Route ${req.method} ${req.originalUrl} not found`,
    ),
  );
}

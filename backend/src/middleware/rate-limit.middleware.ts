import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../infrastructure/redis/rate-limiter.js";
import { AppError } from "../shared/errors/AppError.js";

interface RateLimitOption {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}

export const rateLimit = (options: RateLimitOption) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip ?? "unknown";

      const key = `${options.keyPrefix}:${identifier}`;
      const result = await checkRateLimit(
        key,
        options.windowSeconds,
        options.limit,
      );
      console.log("RESULT" + JSON.stringify(result));

      res.setHeader("X-RateLimit-Limit", options.limit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);

      if (!result.allowed) {
        res.setHeader("RetryAfter", result.retryAfter);

        throw new AppError(
          429,
          "TOO_MANY_REQUESTS",
          "too many requests, try again later",
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

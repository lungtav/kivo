import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { appRouter } from "./routes/index.js";
import { env } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";

export const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.APP_URL, credentials: true }));

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      logger.info(
        { method: req.method, url: req.originalUrl, status: res.statusCode, durationMs: Date.now() - startedAt },
        "request",
      );
    });
    next();
  });

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", appRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

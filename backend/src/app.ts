import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { rateLimit } from "./middleware/rate-limit.middleware.js";
import { appRouter } from "./routes/index.js";
import { env } from "./config/env.js";

export const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.APP_URL, credentials: true }));

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", appRouter);
  app.use(rateLimit);


  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

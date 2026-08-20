import express from "express";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
export const createApp = () => {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded());

  app.use();

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

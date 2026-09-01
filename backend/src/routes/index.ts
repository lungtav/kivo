import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { spacesRouter } from "./spaces.routes.js";
import { messagesRouter } from "./messages.routes.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { channelsRouter } from "./channels.routes.js";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/spaces", authMiddleware, spacesRouter);
appRouter.use("/channel", authMiddleware, channelsRouter);
appRouter.use("/messages", authMiddleware, messagesRouter);

export { appRouter };

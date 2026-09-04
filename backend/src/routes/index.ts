import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { spacesRouter } from "./spaces.routes.js";
import { messagesRouter } from "./messages.routes.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { channelsRouter } from "./channels.routes.js";
import { attachmentsRouter } from "./attachments.routes.js";
import { conversationsRouter } from "./conversations.routes.js";
import { meRouter, usersRouter } from "./users.routes.js";

const appRouter = Router();

appRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

appRouter.use("/auth", authRouter);
appRouter.use("/spaces", authMiddleware, spacesRouter);
appRouter.use("/channel", authMiddleware, channelsRouter);
appRouter.use("/messages", authMiddleware, messagesRouter);
appRouter.use("/attachments", authMiddleware, attachmentsRouter);
appRouter.use("/conversations", authMiddleware, conversationsRouter);
appRouter.use("/me", authMiddleware, meRouter);
appRouter.use("/users", authMiddleware, usersRouter);

export { appRouter };

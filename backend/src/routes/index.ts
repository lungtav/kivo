import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { spacesRouter } from "./spaces.routes.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/spaces", authMiddleware, spacesRouter);

export { appRouter };

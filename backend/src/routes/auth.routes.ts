import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { rateLimitConfig } from "../config/rate-limit.js";
import { register } from "../modules/auth/auth.controller.js";

const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit({ ...rateLimitConfig.register, keyPrefix: "rate-limit:register" }),
  register,
);

export {authRouter}
import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { rateLimitConfig } from "../config/rate-limit.js";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  refresh,
  logout,
} from "../modules/auth/auth.controller.js";

const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit({ ...rateLimitConfig.register, keyPrefix: "rate-limit:register" }),
  register,
);
authRouter.post(
  "/login",
  rateLimit({ ...rateLimitConfig.login, keyPrefix: "rate-limit:login" }),
  login,
);

authRouter.post(
  "/verify-email",
  rateLimit({
    ...rateLimitConfig.verifyEmail,
    keyPrefix: "rate-limit:verify-email",
  }),
  verifyEmail,
);

authRouter.post(
  "/resend-verification",
  rateLimit({
    ...rateLimitConfig.resendVerification,
    keyPrefix: "rate-limit:resend-verification",
  }),
  resendVerification,
);

authRouter.post(
  "/refresh",
  rateLimit({
    ...rateLimitConfig.refresh,
    keyPrefix: "rate-limit:refresh",
  }),
  refresh,
);
authRouter.post(
  "/logout",
  rateLimit({
    ...rateLimitConfig.logout,
    keyPrefix: "rate-limit:logout",
  }),
  logout,
);

export { authRouter };

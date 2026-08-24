import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { RegisterUserSchema, LoginSchema } from "./auth.schema.js";
import type { RegisterUserInput, LoginInput } from "./auth.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";

export const register = asyncHandler(
  async (req: Request<{}, {}, RegisterUserInput>, res: Response) => {
    const parsed = RegisterUserSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const createdUser = await authService.register(parsed.data);

    res
      .status(201)
      .json({ message: "User created successfully", user: createdUser });
  },
);

export const login = asyncHandler(
  async (req: Request<{}, {}, LoginInput>, res: Response) => {
    const parsed = LoginSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((error) => error.message)
        .join(", ");

      throw new ValidationError(message);
    }

    const result = await authService.login(parsed.data);

    res
      .cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        accessToken: result.accessToken,
        user: result.user,
      });
  },
);

export const verifyEmail = asyncHandler(
  async (req: Request<{}, {}, {}, { token?: string }>, res: Response) => {
    const token = req.query.token;

    if (!token) {
      throw new ValidationError("Verification token is required");
    }

    await authService.verifyEmail(token);

    res.status(200).json({
      message: "Email verified successfully",
    });
  },
);

export const resendVerification = asyncHandler(
  async (req: Request<{}, {}, { email?: string }>, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("email is required");
    }

    await authService.resendVerification(email);

    res.status(200).json({
      message: "verification email sent successfully",
    });
  },
);

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token is required");
  }

  const result = await authService.refresh(refreshToken);

  res
    .cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "api/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      accessToken: result.accessToken,
    });
});

import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { RegisterUserSchema, LoginSchema } from "./auth.schema.js";
import type { RegisterUserInput, LoginInput } from "./auth.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

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
      .cookie("refresh_token", result.refreshToken, refreshCookieOptions)
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
  async (req: Request<{}, {}, { email?: string; token?: string }>, res: Response) => {
    const { email, token } = req.body;

    if (token) {
      await authService.resendVerificationFromToken(token);
    } else if (email) {
      await authService.resendVerification(email);
    } else {
      throw new ValidationError("email or verification token is required");
    }

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
    .cookie("refresh_token", result.refreshToken, refreshCookieOptions)
    .status(200)
    .json({
      accessToken: result.accessToken,
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res
    .clearCookie("refresh_token", {
      httpOnly: refreshCookieOptions.httpOnly,
      secure: refreshCookieOptions.secure,
      sameSite: refreshCookieOptions.sameSite,
      path: refreshCookieOptions.path,
    })
    .status(200)
    .json({
      message: "Logout successful",
    });
});

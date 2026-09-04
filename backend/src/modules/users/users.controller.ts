import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { UpdateProfileSchema } from "./users.schema.js";
import type { UpdateProfileInput } from "./users.types.js";
import * as usersService from "./users.service.js";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;

  if (!userId) {
    throw new UnauthorizedError("unauthorized access");
  }

  const user = await usersService.getProfile(userId);
  res.status(200).json({ user });
});

export const updateMe = asyncHandler(
  async (req: Request<{}, {}, UpdateProfileInput>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = UpdateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const user = await usersService.updateProfile(userId, parsed.data);
    res.status(200).json({ message: "profile updated", user });
  },
);

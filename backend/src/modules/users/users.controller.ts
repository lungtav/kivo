import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { UpdateProfileSchema } from "./users.schema.js";
import type { UpdateProfileInput } from "./users.types.js";
import * as usersService from "./users.service.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;

  if (!userId) {
    throw new UnauthorizedError("unauthorized access");
  }

  const user = await usersService.getProfile(userId);
  res.status(200).json({ user });
});

export const getUserProfile = asyncHandler(
  async (req: Request<{ userId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    // reject non-uuid params before they reach a uuid column comparison
    if (!UUID_PATTERN.test(req.params.userId)) {
      throw new NotFoundError("user not found");
    }

    const profile = await usersService.getPublicProfile(userId, req.params.userId);
    res.status(200).json(profile);
  },
);

export const searchUsers = asyncHandler(
  async (req: Request<{}, {}, {}, { q?: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const peers = await usersService.searchUsers(userId, req.query.q ?? "");
    res.status(200).json({ peers });
  },
);

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

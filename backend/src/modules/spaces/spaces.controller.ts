import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import * as spacesService from "./spaces.service.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import type { CreateSpaceInput, UpdateSpaceInput } from "./spaces.types.js";
import { UpdateSpaceSchema } from "./spaces.schema.js";

export const createSpace = asyncHandler(
  async (req: Request<{}, {}, CreateSpaceInput>, res: Response) => {
    const userId = req.user.id;
    const { name } = req.body;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const space = await spacesService.createSpace(userId, name);
    res.status(201).json({ message: "space created successfully", space });
  },
);

export const updateSpace = asyncHandler(
  async (
    req: Request<{ spaceId: string }, {}, UpdateSpaceInput>,
    res: Response,
  ) => {
    const userId = req.user.id;
    const spaceId = req.params.spaceId;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    if (!spaceId) {
      throw new ValidationError("invalid or missing space id");
    }

    const parsed = UpdateSpaceSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const space = await spacesService.updateSpaceDetails(
      spaceId,
      userId,
      parsed.data,
    );
    res.status(200).json({ message: "space updated successfully", space });
  },
);

export const listSpaces = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;

  if (!userId) {
    throw new UnauthorizedError("unauthorized access");
  }
  const spaces = await spacesService.listSpaces(userId);
  res.json({ message: "space fetched successfully", spaces });
});

import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import * as spacesService from "./spaces.service.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import type { CreateSpaceInput } from "./spaces.types.js";

export const createSpace = asyncHandler(
  async (req: Request<{}, {}, CreateSpaceInput>, res: Response) => {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const space = await spacesService.createSpace(userId, name);
    res.status(201).json(space);
  },
);

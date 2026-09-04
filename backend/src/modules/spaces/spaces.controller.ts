import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import * as spacesService from "./spaces.service.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import type { CreateSpaceInput, UpdateSpaceInput } from "./spaces.types.js";
import { CreateSpaceSchema, UpdateSpaceSchema } from "./spaces.schema.js";

export const createSpace = asyncHandler(
  async (req: Request<{}, {}, CreateSpaceInput>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = CreateSpaceSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const result = await spacesService.createSpace(userId, parsed.data.name);
    res.status(201).json({ message: "space created successfully", space: result.space });
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
  res.status(200).json({ message: "space fetched successfully", spaces });
});

export const listSpaceMembers = asyncHandler(
  async (req: Request<{ spaceId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const members = await spacesService.listMembers(req.params.spaceId, userId);
    res.status(200).json({ members });
  },
);

export const changeMemberRole = asyncHandler(
  async (
    req: Request<{ spaceId: string; userId: string }, {}, { role: "admin" | "member" }>,
    res: Response,
  ) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsedRole = req.body?.role;
    if (parsedRole !== "admin" && parsedRole !== "member") {
      throw new ValidationError("role must be admin or member");
    }

    const member = await spacesService.changeMemberRole(
      req.params.spaceId,
      userId,
      req.params.userId,
      parsedRole,
    );
    res.status(200).json({ message: "member role updated", member });
  },
);

export const kickMember = asyncHandler(
  async (req: Request<{ spaceId: string; userId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    await spacesService.kickMember(req.params.spaceId, userId, req.params.userId);
    res.status(200).json({ message: "member removed" });
  },
);

export const leaveSpace = asyncHandler(
  async (req: Request<{ spaceId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    await spacesService.leaveSpace(req.params.spaceId, userId);
    res.status(200).json({ message: "space left" });
  },
);

export const getSpace = asyncHandler(
  async (req: Request<{ spaceId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const space = await spacesService.getSpace(req.params.spaceId, req.user.id);
    res.status(200).json({ message: "Space fetched successfully", space });
  },
);

export const deleteSpace = asyncHandler(
  async (req: Request<{ spaceId: string }>, res: Response) => {
    await spacesService.deleteSpace(req.params.spaceId, req.user.id);
    res.status(204).send();
  },
);

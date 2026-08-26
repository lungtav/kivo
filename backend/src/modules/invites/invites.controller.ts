import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import * as invitesService from "./invites.service.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import type { CreateInviteInput } from "./invites.types.js";
import { CreateInviteSchema } from "./invites.schema.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";

export const createInvite = asyncHandler(
  async (
    req: Request<{ spaceId: string }, {}, CreateInviteInput>,
    res: Response,
  ) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = CreateInviteSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }
    const invite = await invitesService.createInvite(
      req.params.spaceId,
      userId,
      parsed.data,
    );
    res.status(201).json({ message: "Invite created successfully", invite });
  },
);

export const joinSpace = asyncHandler(
  async (req: Request<{ code: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }
    const result = await invitesService.joinSpace(req.params.code, req.user.id);
    res.status(200).json({ message: "space joined", result });
  },
);

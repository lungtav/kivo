import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import type { CreateChannelInput } from "./channels.types.js";
import { CreateChannelSchema } from "./channels.schema.js";
import * as channelsService from "./channels.service.js";

export const createChannel = asyncHandler(
  async (
    req: Request<{ spaceId: string }, {}, CreateChannelInput>,
    res: Response,
  ) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = CreateChannelSchema.safeParse(req.body);

    const channel = await channelsService.createChannel(
      req.params.spaceId,
      userId,
      req.body,
    );
    res.status(201).json({ message: "Channel created successfully", channel });
  },
);

export const joinChannel = asyncHandler(
  async (req: Request<{ channelId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const channel = await channelsService.joinChannel(
      req.params.channelId,
      userId,
    );
    res.status(200).json({ message: "channel joined successfully", channel });
  },
);

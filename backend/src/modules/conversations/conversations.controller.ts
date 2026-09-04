import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { CreateConversationSchema } from "./conversations.schema.js";
import type { CreateConversationInput } from "./conversations.types.js";
import * as conversationsService from "./conversations.service.js";

export const createConversation = asyncHandler(
  async (req: Request<{}, {}, CreateConversationInput>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = CreateConversationSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const conversation = await conversationsService.createConversation(
      userId,
      parsed.data,
    );
    res.status(201).json({ message: "conversation created", conversation });
  },
);

export const listConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const conversations = await conversationsService.listConversations(userId);
    res.status(200).json({ conversations });
  },
);

export const leaveConversation = asyncHandler(
  async (req: Request<{ conversationId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    await conversationsService.leaveConversation(req.params.conversationId, userId);
    res.status(200).json({ message: "conversation left" });
  },
);

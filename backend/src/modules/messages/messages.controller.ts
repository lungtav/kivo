import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import type { CreateMessageInput } from "./messages.types.js";
import { CreateMessageSchema, GetMessagesQuerySchema } from "./messages.schema.js";
import * as messagesService from "./messages.service.js";

export const sendMessage = asyncHandler(
  async (
    req: Request<{ conversationId: string }, {}, CreateMessageInput>,
    res: Response,
  ) => {
    const userId = req.user.id;

    if (!userId) {
      throw new ValidationError("Unauthorized access");
    }
    const parsed = CreateMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const messageSent = await messagesService.sendMessage(
      req.params.conversationId,
      userId,
      parsed.data,
    );

    res.status(200).json({
      message: "message sent successfully",
      messageSent,
    });
  },
);

export const getMessages = asyncHandler(
  async (
    req: Request<{ conversationId: string }>,
    res: Response,
  ) => {
    const userId = req.user.id;

    if (!userId) {
      throw new ValidationError("Unauthorized access");
    }

    const parsed = GetMessagesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const { messages, nextCursor } = await messagesService.getMessages(
      req.params.conversationId,
      userId,
      parsed.data.limit,
      parsed.data.before,
    );

    res.status(200).json({ messages, nextCursor });
  },
);

import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../shared/errors/UnauthorizedError.js";
import { NotFoundError } from "../shared/errors/NotFoundError.js";
import * as callLogsRepository from "../modules/calls/call-logs.repository.js";
import * as messagesRepository from "../modules/messages/messages.repository.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const callsRouter = Router();

// GET /api/calls/:conversationId — recent calls in a conversation
callsRouter.get("/:conversationId", asyncHandler(
  async (req: Request<{ conversationId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }
    if (!UUID_PATTERN.test(req.params.conversationId)) {
      throw new NotFoundError("conversation not found");
    }

    const isMember = await messagesRepository.isConversationMember(
      req.params.conversationId,
      userId,
    );
    if (!isMember) {
      throw new NotFoundError("conversation not found");
    }

    const calls = await callLogsRepository.listForConversation(
      req.params.conversationId,
      20,
    );
    res.status(200).json({ calls });
  },
));

export { callsRouter };

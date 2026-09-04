import { Router } from "express";
import {
  createConversation,
  leaveConversation,
  listConversations,
} from "../modules/conversations/conversations.controller.js";

const conversationsRouter = Router();

conversationsRouter.post("/", createConversation);
conversationsRouter.get("/", listConversations);
conversationsRouter.post("/:conversationId/leave", leaveConversation);

export { conversationsRouter };

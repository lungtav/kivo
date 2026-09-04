import { Router } from "express";
import {
  createConversation,
  leaveConversation,
  listConversations,
  listPeers,
} from "../modules/conversations/conversations.controller.js";

const conversationsRouter = Router();

conversationsRouter.post("/", createConversation);
conversationsRouter.get("/", listConversations);
conversationsRouter.get("/peers", listPeers);
conversationsRouter.post("/:conversationId/leave", leaveConversation);

export { conversationsRouter };

import { Router } from "express";
import {
  sendMessage,
  getMessages,
  searchMessages,
  markRead,
  editMessage,
  deleteMessage,
} from "../modules/messages/messages.controller.js";

const messagesRouter = Router();

messagesRouter.post("/:conversationId", sendMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.get("/:conversationId/search", searchMessages);
messagesRouter.post("/:conversationId/read", markRead);
messagesRouter.patch("/:messageId", editMessage);
messagesRouter.delete("/:messageId", deleteMessage);

export { messagesRouter };

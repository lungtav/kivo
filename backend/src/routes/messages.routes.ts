import { Router } from "express";
import {
  sendMessage,
  getMessages,
  markRead,
  editMessage,
  deleteMessage,
} from "../modules/messages/messages.controller.js";

const messagesRouter = Router();

messagesRouter.post("/:conversationId", sendMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.post("/:conversationId/read", markRead);
messagesRouter.patch("/:messageId", editMessage);
messagesRouter.delete("/:messageId", deleteMessage);

export { messagesRouter };

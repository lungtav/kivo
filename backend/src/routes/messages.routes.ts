import { Router } from "express";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
} from "../modules/messages/messages.controller.js";

const messagesRouter = Router();

messagesRouter.post("/:conversationId", sendMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.patch("/:messageId", editMessage);
messagesRouter.delete("/:messageId", deleteMessage);

export { messagesRouter };

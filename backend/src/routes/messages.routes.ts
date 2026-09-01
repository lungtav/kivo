import { Router } from "express";
import {
  sendMessage,
  getMessages,
} from "../modules/messages/messages.controller.js";

const messagesRouter = Router();

messagesRouter.post("/:conversationId", sendMessage);
messagesRouter.get("/:conversationId", getMessages);

export { messagesRouter };

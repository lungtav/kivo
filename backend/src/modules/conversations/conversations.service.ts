import type { CreateConversationInput } from "./conversations.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import * as conversationsRepository from "./conversations.repository.js";
import * as messagesRepository from "../messages/messages.repository.js";

export const createConversation = async (
  userId: string,
  input: CreateConversationInput,
) => {
  if (input.type === "dm") {
    if (input.userId === userId) {
      throw new ValidationError("you cannot start a conversation with yourself");
    }
    const peer = await messagesRepository.getUserProfile(input.userId);
    if (!peer) {
      throw new NotFoundError("user not found");
    }

    const existing = await conversationsRepository.findDirectConversation(
      userId,
      input.userId,
    );
    if (existing) {
      return existing;
    }

    const conversationId = await conversationsRepository.createDirectConversation(
      userId,
      input.userId,
    );
    return conversationsRepository.findConversationForUser(conversationId, userId);
  }

  const memberIds = [...new Set(input.memberIds)].filter((id) => id !== userId);
  if (memberIds.length > 0) {
    const existingCount = await conversationsRepository.countExistingUsers(memberIds);
    if (existingCount !== memberIds.length) {
      throw new ValidationError("one or more members do not exist");
    }
  }

  const conversationId = await conversationsRepository.createGroupConversation(
    userId,
    input.name,
    memberIds,
  );
  return conversationsRepository.findConversationForUser(conversationId, userId);
};

export const listConversations = (userId: string) =>
  conversationsRepository.listConversationsForUser(userId);

export const listPeers = (userId: string) =>
  conversationsRepository.listPeersForUser(userId);

export const leaveConversation = async (
  conversationId: string,
  userId: string,
) => {
  const left = await conversationsRepository.leaveConversation(
    conversationId,
    userId,
  );
  if (!left) {
    throw new NotFoundError("conversation not found");
  }
};

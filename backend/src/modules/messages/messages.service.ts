import type { CreateMessageInput } from "./messages.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ForbiddenError } from "../../shared/errors/ForbiddenError.js";
import { mediaQueue } from "../../infrastructure/queue/queue.js";
import { getSocketServer } from "../../infrastructure/websocket/io.js";
import * as messagesRepository from "../messages/messages.repository.js";

// the DB media_type enum is image/video/audio/file — derive it, don't trust the client
const mediaTypeFromMime = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

export const sendMessage = async (
  conversationId: string,
  userId: string,
  input: CreateMessageInput,
) => {
  const isMember = await messagesRepository.isConversationMember(
    conversationId,
    userId,
  );
  if (!isMember) {
    throw new NotFoundError("conversation not found");
  }

  const hasContent = !!input.content?.trim();
  const hasAttachments = !!input.attachments?.length;

  if (!hasContent && !hasAttachments) {
    throw new ValidationError("message must have content or an attachment");
  }

  if (input.replyToId) {
    const original = await messagesRepository.findMessageById(input.replyToId);
    if (!original || original.conversation_id !== conversationId || original.deleted_at) {
      throw new ValidationError(
        "reply target does not belong to this conversation",
      );
    }
  }

  const message = await messagesRepository.createMessageWithAttachments(
    conversationId,
    userId,
    hasContent ? input.content!.trim() : null,
    input.replyToId ?? null,
    (input.attachments ?? []).map((a) => ({
      mediaType: mediaTypeFromMime(a.mimeType),
      storageKey: a.storageKey,
      mimeType: a.mimeType,
      fileSizeBytes: a.fileSizeBytes ?? null,
    })),
  );

  for (const attachment of message.attachments) {
    await mediaQueue.add("process-attachment", { attachmentId: attachment.id });
  }

  // broadcast from the service so REST and socket sends reach the room exactly once
  getSocketServer()
    ?.to(`conversation:${conversationId}`)
    .emit("message:new", message);

  return message;
};

export const editMessage = async (
  messageId: string,
  userId: string,
  content: string,
) => {
  const message = await messagesRepository.findMessageById(messageId);
  if (!message || message.deleted_at) {
    throw new NotFoundError("message not found");
  }
  if (message.sender_id !== userId) {
    throw new ForbiddenError("you can only edit your own messages");
  }
  const isMember = await messagesRepository.isConversationMember(
    message.conversation_id,
    userId,
  );
  if (!isMember) {
    throw new NotFoundError("message not found");
  }

  await messagesRepository.editMessage(messageId, content);
  const updated = await messagesRepository.getHydratedMessage(messageId);

  getSocketServer()
    ?.to(`conversation:${message.conversation_id}`)
    .emit("message:update", updated);

  return updated;
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await messagesRepository.findMessageById(messageId);
  if (!message || message.deleted_at) {
    throw new NotFoundError("message not found");
  }
  if (message.sender_id !== userId) {
    throw new ForbiddenError("you can only delete your own messages");
  }

  const deleted = await messagesRepository.softDeleteMessage(messageId);
  if (!deleted) {
    throw new NotFoundError("message not found");
  }

  getSocketServer()
    ?.to(`conversation:${message.conversation_id}`)
    .emit("message:delete", {
      conversationId: message.conversation_id,
      messageId,
    });
};

export const markConversationRead = async (
  conversationId: string,
  userId: string,
) => {
  const isMember = await messagesRepository.isConversationMember(
    conversationId,
    userId,
  );
  if (!isMember) {
    throw new NotFoundError("conversation not found");
  }
  return messagesRepository.markConversationRead(conversationId, userId);
};

export const searchMessages = async (
  conversationId: string,
  userId: string,
  query: string,
) => {
  const isMember = await messagesRepository.isConversationMember(
    conversationId,
    userId,
  );
  if (!isMember) {
    throw new NotFoundError("conversation not found");
  }
  return messagesRepository.searchMessages(conversationId, query);
};

export const getMessages = async (
  conversationId: string,
  userId: string,
  limit: number,
  before?: string,
) => {
  const isMember = await messagesRepository.isConversationMember(
    conversationId,
    userId,
  );
  if (!isMember) {
    throw new NotFoundError("conversation not found");
  }

  // repository returns newest-first for cursor paging; clients get oldest-first
  const rows = await messagesRepository.getMessages(
    conversationId,
    limit,
    before,
  );
  const messages = [...rows].reverse();

  return { messages, nextCursor: messages.length > 0 ? messages[0].id : null };
};

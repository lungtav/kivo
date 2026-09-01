import type { CreateMessageInput } from "./messages.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { mediaQueue } from "../../infrastructure/queue/queue.js";
import * as messagesRepository from "../messages/messages.repository.js";

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
    if (!original || original.conversation_id !== conversationId) {
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
      mediaType: a.mediaType,
      storageKey: a.storageKey,
      mimeType: a.mimeType,
      fileSizeBytes: a.fileSizeBytes ?? null,
    })),
  );

  for (const attachment of message.attachments) {
    await mediaQueue.add("process-attachment", { attachmentId: attachment.id });
  }

  return message;
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

  const messages = await messagesRepository.getMessages(
    conversationId,
    limit,
    before,
  );

  return messages;
};

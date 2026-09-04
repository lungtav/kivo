import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { getReadUrl } from "../../infrastructure/storage/client.js";
import * as attachmentsRepository from "./attachments.repository.js";
import * as messagesRepository from "../messages/messages.repository.js";

export const getAttachmentReadUrl = async (
  attachmentId: string,
  userId: string,
) => {
  const attachment = await attachmentsRepository.findAttachmentById(attachmentId);
  // non-members get the same 404 as a missing attachment — don't leak existence
  if (!attachment) {
    throw new NotFoundError("attachment not found");
  }

  const isMember = await messagesRepository.isConversationMember(
    attachment.message_id,
    userId,
  );
  if (!isMember) {
    throw new NotFoundError("attachment not found");
  }

  return { readUrl: await getReadUrl(attachment.storage_key) };
};

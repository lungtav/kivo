import { db } from "../../config/database.js";

export const createAttachment = async (
  client: any, // pg PoolClient, passed in so it's part of the same transaction
  messageId: string,
  mediaType: string,
  storageKey: string,
  mimeType: string,
  fileSizeBytes: number | null,
) => {
  const result = await client.query(
    `INSERT INTO message_attachments (message_id, media_type, storage_key, mime_type, file_size_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, message_id, media_type, storage_key, mime_type, file_size_bytes, thumbnail_url, processing_status, width, height, duration_seconds`,
    [messageId, mediaType, storageKey, mimeType, fileSizeBytes],
  );
  return result.rows[0];
};

export const updateProcessingResult = async (
  attachmentId: string,
  fields: {
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    status: "ready" | "failed";
  },
) => {
  const result = await db.query(
    `UPDATE message_attachments
     SET thumbnail_url = $1, width = $2, height = $3, duration_seconds = $4, processing_status = $5
     WHERE id = $6
     RETURNING id`,
    [
      fields.thumbnailUrl ?? null,
      fields.width ?? null,
      fields.height ?? null,
      fields.durationSeconds ?? null,
      fields.status,
      attachmentId,
    ],
  );
  return result.rows[0] ?? null;
};

export const findAttachmentById = async (attachmentId: string) => {
  const result = await db.query(
    `SELECT a.id, a.message_id, a.media_type, a.storage_key, a.mime_type, a.file_size_bytes, a.thumbnail_url, a.processing_status, a.width, a.height, a.duration_seconds,
            m.conversation_id
     FROM message_attachments a
     JOIN messages m ON m.id = a.message_id
     WHERE a.id = $1`,
    [attachmentId],
  );
  return result.rows[0] ?? null;
};

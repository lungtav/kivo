import { db } from "../../config/database.js";
import * as attachmentsRepository from "../attachments/attachments.repository.js";

export const createMessageWithAttachments = async (
  conversationId: string,
  senderId: string,
  content: string | null,
  replyToId: string | null,
  attachments: {
    mediaType: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number | null;
  }[],
) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const type = attachments.length > 0 ? "media" : "text";

    const messageResult = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, type, content, reply_to_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, conversation_id, sender_id, type, content, reply_to_id, created_at, edited_at`,
      [conversationId, senderId, type, content, replyToId],
    );
    const message = messageResult.rows[0];

    const attachmentRows = [];
    for (const a of attachments) {
      const row = await attachmentsRepository.createAttachment(
        client,
        message.id,
        a.mediaType,
        a.storageKey,
        a.mimeType,
        a.fileSizeBytes,
      );
      attachmentRows.push(row);
    }

    await client.query("COMMIT");
    return { ...message, attachments: attachmentRows };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const findMessageById = async (id: string) => {
  const result = await db.query(
    `SELECT id, conversation_id, sender_id, type, content, reply_to_id, created_at, edited_at, deleted_at
     FROM messages
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

export const isConversationMember = async (
  conversationId: string,
  userId: string,
) => {
  const result = await db.query(
    `SELECT 1 FROM conversation_members
     WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [conversationId, userId],
  );
  return result.rows.length > 0;
};

export const listConversationIdsForUser = async (userId: string) => {
  const result = await db.query(
    `SELECT conversation_id FROM conversation_members
     WHERE user_id = $1 AND left_at IS NULL`,
    [userId],
  );
  return result.rows.map((r) => r.conversation_id);
};

export const getMessages = async (
  conversationId: string,
  limit = 50,
  before?: string,
) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const values: (string | number)[] = [conversationId, safeLimit];

  let cursorCondition = "";

  if (before) {
    values.push(before);
    cursorCondition = `
      AND m.created_at < (
        SELECT created_at
        FROM messages
        WHERE id = $3
          AND conversation_id = $1
      )
    `;
  }

  const result = await db.query(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.type,
        m.content,
        m.reply_to_id,
        m.created_at,
        m.edited_at,
        m.deleted_at,
        u.display_name AS sender_display_name,
        u.username AS sender_username,

        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'mediaType', a.media_type,
              'storageKey', a.storage_key,
              'mimeType', a.mime_type,
              'fileSizeBytes', a.file_size_bytes
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS attachments

      FROM messages m

      JOIN users u
        ON u.id = m.sender_id

      LEFT JOIN message_attachments a
        ON a.message_id = m.id

      WHERE m.conversation_id = $1
        AND m.deleted_at IS NULL
        ${cursorCondition}

      GROUP BY m.id, u.display_name, u.username

      ORDER BY m.created_at DESC

      LIMIT $2
    `,
    values,
  );

  return result.rows;
};

export const getUserProfile = async (userId: string) => {
  const result = await db.query(
    `SELECT id, display_name, username, avatar_url FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  return result.rows[0] ?? null;
};

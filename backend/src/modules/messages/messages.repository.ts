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

    // hydrate so clients get sender names and camelCase attachments, matching list responses
    const hydrated = await getHydratedMessage(message.id);
    return {
      ...(hydrated ?? message),
      attachments: attachmentRows.map((row) => ({
        id: row.id,
        mediaType: row.media_type,
        mimeType: row.mime_type,
        fileSizeBytes: row.file_size_bytes,
      })),
    };
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

export const getHydratedMessage = async (id: string) => {
  const result = await db.query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.type, m.content, m.reply_to_id, m.created_at, m.edited_at, m.deleted_at,
            u.display_name AS sender_display_name, u.username AS sender_username,
            CASE WHEN r.id IS NULL THEN NULL ELSE json_build_object(
              'id', r.id,
              'author', COALESCE(ru.display_name, ru.username),
              'content', r.content,
              'type', r.type,
              'isDeleted', r.deleted_at IS NOT NULL
            ) END AS reply_to
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN messages r ON r.id = m.reply_to_id
     LEFT JOIN users ru ON ru.id = r.sender_id
     WHERE m.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

export const editMessage = async (messageId: string, content: string) => {
  const result = await db.query(
    `UPDATE messages SET content = $2, edited_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [messageId, content],
  );
  return result.rows[0] ?? null;
};

export const softDeleteMessage = async (messageId: string) => {
  const result = await db.query(
    `UPDATE messages SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, conversation_id`,
    [messageId],
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

export const markConversationRead = async (conversationId: string, userId: string) => {
  const result = await db.query(
    `UPDATE conversation_members
     SET last_read_message_id = (
       SELECT id FROM messages
       WHERE conversation_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1
     )
     WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
     RETURNING last_read_message_id`,
    [conversationId, userId],
  );
  return result.rows[0] ?? null;
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
    // row-wise comparison so messages sharing a created_at never get skipped or duplicated
    cursorCondition = `
      AND (m.created_at, m.id) < (
        SELECT created_at, id
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
        -- deleted messages stay in history as content-less tombstones
        CASE WHEN m.deleted_at IS NULL THEN m.content END AS content,
        m.reply_to_id,
        m.created_at,
        m.edited_at,
        m.deleted_at,
        u.display_name AS sender_display_name,
        u.username AS sender_username,

        CASE WHEN r.id IS NULL THEN NULL ELSE json_build_object(
          'id', r.id,
          'author', COALESCE(ru.display_name, ru.username),
          'content', r.content,
          'type', r.type,
          'isDeleted', r.deleted_at IS NOT NULL
        ) END AS reply_to,

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
        ON a.message_id = m.id AND m.deleted_at IS NULL

      LEFT JOIN messages r
        ON r.id = m.reply_to_id

      LEFT JOIN users ru
        ON ru.id = r.sender_id

      WHERE m.conversation_id = $1
        ${cursorCondition}

      GROUP BY m.id, u.display_name, u.username, r.id, ru.id

      ORDER BY m.created_at DESC

      LIMIT $2
    `,
    values,
  );

  return result.rows;
};

export const searchMessages = async (conversationId: string, query: string) => {
  const result = await db.query(
    `SELECT m.id, m.conversation_id, m.content, m.created_at,
            u.display_name AS sender_display_name, u.username AS sender_username
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
       AND m.deleted_at IS NULL
       AND m.content ILIKE '%' || $2 || '%'
     ORDER BY m.created_at DESC
     LIMIT 20`,
    [conversationId, query],
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

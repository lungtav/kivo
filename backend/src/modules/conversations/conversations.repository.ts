import { db } from "../../config/database.js";

// conversations the user belongs to, with the other party resolved for DMs
const conversationSelection = `
  SELECT
    c.id,
    c.type,
    c.name,
    c.created_at,
    peer.id AS peer_id,
    peer.display_name AS peer_display_name,
    peer.username AS peer_username,
    peer.avatar_url AS peer_avatar_url,
    (
      SELECT COUNT(*)::int FROM conversation_members active
      WHERE active.conversation_id = c.id AND active.left_at IS NULL
    ) AS member_count,
    (
      SELECT COUNT(*)::int FROM messages unread
      WHERE unread.conversation_id = c.id
        AND unread.deleted_at IS NULL
        AND unread.sender_id <> mine.user_id
        AND (mine.last_read_message_id IS NULL OR unread.created_at > COALESCE(
          (SELECT marker.created_at FROM messages marker WHERE marker.id = mine.last_read_message_id),
          to_timestamp(0)
        ))
    ) AS unread_count
  FROM conversations c
  JOIN conversation_members mine
    ON mine.conversation_id = c.id AND mine.user_id = $1 AND mine.left_at IS NULL
  LEFT JOIN LATERAL (
    SELECT u.id, u.display_name, u.username, u.avatar_url
    FROM conversation_members other
    JOIN users u ON u.id = other.user_id
    WHERE other.conversation_id = c.id AND other.user_id <> $1 AND other.left_at IS NULL
    ORDER BY other.joined_at
    LIMIT 1
  ) peer ON c.type = 'dm'
  WHERE c.deleted_at IS NULL
`;

export const listConversationsForUser = async (userId: string) => {
  const result = await db.query(
    `${conversationSelection} AND c.type IN ('dm', 'group_dm')
     ORDER BY c.created_at DESC`,
    [userId],
  );
  return result.rows;
};

export const findConversationForUser = async (
  conversationId: string,
  userId: string,
) => {
  const result = await db.query(
    `${conversationSelection} AND c.id = $2`,
    [userId, conversationId],
  );
  return result.rows[0] ?? null;
};

// a DM is unique per pair — look for a dm conversation whose active members are exactly these two
export const findDirectConversation = async (userId: string, peerId: string) => {
  const result = await db.query(
    `${conversationSelection} AND c.type = 'dm'
     AND EXISTS (
       SELECT 1 FROM conversation_members peer_member
       WHERE peer_member.conversation_id = c.id
         AND peer_member.user_id = $2 AND peer_member.left_at IS NULL
     )
     AND (
       SELECT COUNT(*)::int FROM conversation_members pair
       WHERE pair.conversation_id = c.id AND pair.left_at IS NULL
     ) = 2`,
    [userId, peerId],
  );
  return result.rows[0] ?? null;
};

export const createDirectConversation = async (userId: string, peerId: string) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const conversationResult = await client.query(
      `INSERT INTO conversations (type, created_by) VALUES ('dm', $1) RETURNING id`,
      [userId],
    );
    const conversationId = conversationResult.rows[0].id;

    await client.query(
      `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
      [conversationId, userId, peerId],
    );

    await client.query("COMMIT");
    return conversationId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const createGroupConversation = async (
  creatorId: string,
  name: string,
  memberIds: string[],
) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const conversationResult = await client.query(
      `INSERT INTO conversations (type, name, created_by) VALUES ('group_dm', $1, $2) RETURNING id`,
      [name, creatorId],
    );
    const conversationId = conversationResult.rows[0].id;

    await client.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [conversationId, creatorId],
    );

    if (memberIds.length > 0) {
      const values = memberIds
        .map((_id, index) => `($1, $${index + 3}, 'member')`)
        .join(", ");
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id, role)
         VALUES ${values}
         ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [conversationId, ...memberIds],
      );
    }

    await client.query("COMMIT");
    return conversationId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const leaveConversation = async (conversationId: string, userId: string) => {
  const result = await db.query(
    `UPDATE conversation_members SET left_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
     RETURNING user_id`,
    [conversationId, userId],
  );
  return result.rows[0] ?? null;
};

export const countExistingUsers = async (userIds: string[]) => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS count FROM users
     WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [userIds],
  );
  return result.rows[0].count as number;
};

// people you could start a DM with: everyone sharing a space with you
export const listPeersForUser = async (userId: string) => {
  const result = await db.query(
    `SELECT DISTINCT u.id, u.display_name, u.username, u.avatar_url
     FROM space_members sm
     JOIN space_members mine
       ON mine.space_id = sm.space_id AND mine.user_id = $1 AND mine.left_at IS NULL
     JOIN users u ON u.id = sm.user_id
     WHERE sm.user_id <> $1 AND sm.left_at IS NULL AND u.deleted_at IS NULL
     ORDER BY u.display_name ASC`,
    [userId],
  );
  return result.rows;
};

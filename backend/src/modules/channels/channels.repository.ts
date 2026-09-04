import { db } from "../../config/database.js";

export const getMaxPosition = async (
  spaceId: string,
  categoryId: string | null,
) => {
  const result = await db.query(
    `SELECT COALESCE(MAX(position), -1) AS max_position
     FROM conversations
     WHERE space_id = $1 AND type = 'channel' AND deleted_at IS NULL
     AND category_id IS NOT DISTINCT FROM $2`,
    [spaceId, categoryId],
  );
  return result.rows[0].max_position as number;
};

export const createChannel = async (
  spaceId: string,
  name: string,
  createdBy: string,
  categoryId: string | null,
  position: number,
) => {
  const result = await db.query(
    `INSERT INTO conversations (type, space_id, category_id, name, created_by, position)
     VALUES ('channel', $1, $2, $3, $4, $5)
     RETURNING id, type, space_id, category_id, name, created_by, position, created_at`,
    [spaceId, categoryId, name, createdBy, position],
  );
  return result.rows[0];
};

export const addChannelMember = async (channelId: string, userId: string) => {
  await db.query(
    `INSERT INTO conversation_members (conversation_id, user_id, role)
     VALUES ($1, $2, 'member')
     ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL`,
    [channelId, userId],
  );
};

export const addSpaceAdminsToChannel = async (channelId: string, spaceId: string) => {
  await db.query(
    `INSERT INTO conversation_members (conversation_id, user_id, role)
     SELECT $1, sm.user_id, 'member'
     FROM space_members sm
     WHERE sm.space_id = $2
       AND sm.left_at IS NULL
       AND sm.role IN ('owner', 'admin')
     ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL`,
    [channelId, spaceId],
  );
};

export const deleteChannel = async (channelId: string) => {
  const result = await db.query(
    `UPDATE conversations SET deleted_at = NOW()
     WHERE id = $1 AND type = 'channel' AND deleted_at IS NULL
     RETURNING id`,
    [channelId],
  );
  return result.rows[0] ?? null;
};

export const findChannelById = async (id: string) => {
  const result = await db.query(
    `SELECT id, type, space_id, category_id, name, created_by, position, created_at
     FROM conversations
     WHERE id = $1 AND type = 'channel' AND deleted_at IS NULL`,
    [id],
  );

  return result.rows[0] ?? null;
};

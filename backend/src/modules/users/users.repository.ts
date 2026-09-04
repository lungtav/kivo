import { db } from "../../config/database.js";

export const findProfileById = async (userId: string) => {
  const result = await db.query(
    `SELECT id, email, display_name, username, avatar_url, bio, created_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  return result.rows[0] ?? null;
};

export const findUsernameTaken = async (username: string, excludeUserId: string) => {
  const result = await db.query(
    `SELECT 1 FROM users
     WHERE username = $1 AND id <> $2 AND deleted_at IS NULL`,
    [username, excludeUserId],
  );
  return result.rows.length > 0;
};

export const sharesSpaceWith = async (userId: string, targetUserId: string) => {
  const result = await db.query(
    `SELECT 1
     FROM space_members mine
     JOIN space_members theirs
       ON theirs.space_id = mine.space_id AND theirs.user_id = $2 AND theirs.left_at IS NULL
     WHERE mine.user_id = $1 AND mine.left_at IS NULL
     LIMIT 1`,
    [userId, targetUserId],
  );
  return result.rows.length > 0;
};

export const updateProfile = async (
  userId: string,
  fields: { display_name?: string; username?: string; avatar_url?: string; bio?: string | null },
) => {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (fields.display_name !== undefined) {
    setClauses.push(`display_name = $${i++}`);
    values.push(fields.display_name);
  }
  if (fields.username !== undefined) {
    setClauses.push(`username = $${i++}`);
    values.push(fields.username);
  }
  if (fields.avatar_url !== undefined) {
    setClauses.push(`avatar_url = $${i++}`);
    values.push(fields.avatar_url);
  }
  if (fields.bio !== undefined) {
    setClauses.push(`bio = $${i++}`);
    values.push(fields.bio);
  }

  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${setClauses.join(", ")}
     WHERE id = $${i} AND deleted_at IS NULL
     RETURNING id, email, display_name, username, avatar_url, bio`,
    values,
  );
  return result.rows[0] ?? null;
};

export const findCommonSpaces = async (userId: string, targetUserId: string) => {
  const result = await db.query(
    `SELECT s.id, s.name, s.slug, s.avatar_url
     FROM space_members mine
     JOIN space_members theirs
       ON theirs.space_id = mine.space_id AND theirs.user_id = $2 AND theirs.left_at IS NULL
     JOIN spaces s
       ON s.id = mine.space_id AND s.deleted_at IS NULL
     WHERE mine.user_id = $1 AND mine.left_at IS NULL
     ORDER BY s.name`,
    [userId, targetUserId],
  );
  return result.rows;
};

export const findCommonGroups = async (userId: string, targetUserId: string) => {
  const result = await db.query(
    `SELECT c.id, c.name,
       (SELECT COUNT(*)::int FROM conversation_members m
        WHERE m.conversation_id = c.id AND m.left_at IS NULL) AS member_count
     FROM conversations c
     JOIN conversation_members mine
       ON mine.conversation_id = c.id AND mine.user_id = $1 AND mine.left_at IS NULL
     JOIN conversation_members theirs
       ON theirs.conversation_id = c.id AND theirs.user_id = $2 AND theirs.left_at IS NULL
     WHERE c.type = 'group_dm' AND c.deleted_at IS NULL
     ORDER BY c.name`,
    [userId, targetUserId],
  );
  return result.rows;
};

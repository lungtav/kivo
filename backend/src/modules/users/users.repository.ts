import { db } from "../../config/database.js";

export const findProfileById = async (userId: string) => {
  const result = await db.query(
    `SELECT id, email, display_name, username, avatar_url, created_at
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

export const updateProfile = async (
  userId: string,
  fields: { display_name?: string; username?: string; avatar_url?: string },
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

  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${setClauses.join(", ")}
     WHERE id = $${i} AND deleted_at IS NULL
     RETURNING id, email, display_name, username, avatar_url`,
    values,
  );
  return result.rows[0] ?? null;
};

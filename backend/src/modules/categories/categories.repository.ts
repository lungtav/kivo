import { db } from "../../config/database.js";

export const getMaxPosition = async (spaceId: string) => {
  const result = await db.query(
    `SELECT COALESCE(MAX(position), -1) AS max_position
     FROM categories
     WHERE space_id = $1 AND deleted_at IS NULL`,
    [spaceId],
  );
  return result.rows[0].max_position as number;
};

export const createCategory = async (
  spaceId: string,
  name: string,
  position: number,
) => {
  const result = await db.query(
    `INSERT INTO categories (space_id, name, position)
     VALUES ($1, $2, $3)
     RETURNING id, space_id, name, position, created_at`,
    [spaceId, name, position],
  );
  return result.rows[0];
};

export const findCategoryById = async (id: string) => {
  const result = await db.query(
    `SELECT id, space_id, name, position, created_at
     FROM categories
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
};


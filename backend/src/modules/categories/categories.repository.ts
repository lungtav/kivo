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

export const deleteCategory = async (categoryId: string) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE conversations SET category_id = NULL
       WHERE category_id = $1 AND deleted_at IS NULL`,
      [categoryId],
    );
    const result = await client.query(
      `UPDATE categories SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [categoryId],
    );
    await client.query("COMMIT");
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


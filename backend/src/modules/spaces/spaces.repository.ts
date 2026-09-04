import { db } from "../../config/database.js";

export const createSpace = async (
  name: string,
  slug: string,
  userId: string,
) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    //create the space
    const spaceResult = await client.query(
      `
    INSERT INTO spaces (name, slug, created_by)
    VALUES ($1, $2, $3)
    RETURNING *
`,
      [name, slug, userId],
    );

    const space = spaceResult.rows[0];

    //add creator as member of space
    await client.query(
      `
    INSERT INTO space_members (space_id, user_id, role)
    VALUES ($1, $2, $3)
    `,
      [space.id, userId, "owner"],
    );

    await client.query("COMMIT");

    return { space };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findSpaceById = async (id: string) => {
  const result = await db.query(
    `SELECT id, name, slug, avatar_url, created_by, created_at
     FROM spaces
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
};

export const getMembership = async (spaceId: string, userId: string) => {
  const result = await db.query(
    `SELECT role FROM space_members
     WHERE space_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [spaceId, userId],
  );
  return result.rows[0] ?? null;
};

export const updateSpace = async (
  id: string,
  fields: { name?: string; avatar_url?: string; bio?: string },
) => {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (fields.name !== undefined) {
    setClauses.push(`name = $${i++}`);
    values.push(fields.name);
  }
  if (fields.avatar_url !== undefined) {
    setClauses.push(`avatar_url = $${i++}`);
    values.push(fields.avatar_url);
  }
  if (fields.bio !== undefined) {
    setClauses.push(`bio = $${i++}`);
    values.push(fields.bio);
  }

  values.push(id);

  const result = await db.query(
    `UPDATE spaces SET ${setClauses.join(", ")}
     WHERE id = $${i} AND deleted_at IS NULL
     RETURNING id, name,bio, slug, avatar_url, created_by, created_at`,
    values,
  );
  return result.rows[0] ?? null;
};

export const deleteSpace = async (spaceId: string) => {
  const result = await db.query(
    `UPDATE spaces SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [spaceId],
  );
  return result.rows[0] ?? null;
};

export const listSpacesForUser = async (userId: string) => {
  const result = await db.query(
    `SELECT s.id, s.name, s.slug, s.avatar_url, s.created_by, sm.joined_at, sm.role
     FROM spaces s
     JOIN space_members sm ON sm.space_id = s.id
     WHERE sm.user_id = $1 AND sm.left_at IS NULL AND s.deleted_at IS NULL
     ORDER BY sm.joined_at DESC`,
    [userId],
  );
  return result.rows;
};

export const getSpaceStructure = async (
  spaceId: string,
  userId: string,
  canManage: boolean,
) => {
  const [spaceResult, categoriesResult, channelsResult] = await Promise.all([
    db.query(
      `SELECT id, name, slug, avatar_url, created_by, created_at
       FROM spaces
       WHERE id = $1 AND deleted_at IS NULL`,
      [spaceId],
    ),
    db.query(
      `SELECT c.id, c.name, c.position
       FROM categories c
       WHERE c.space_id = $1 AND c.deleted_at IS NULL
       AND ($2::boolean OR EXISTS (
         SELECT 1 FROM conversations ch
         JOIN conversation_members cm ON cm.conversation_id = ch.id
         WHERE ch.category_id = c.id AND ch.deleted_at IS NULL
           AND cm.user_id = $3 AND cm.left_at IS NULL
       ))
       ORDER BY position ASC`,
      [spaceId, canManage, userId],
    ),
    db.query(
      `SELECT id, name, type, position, category_id
       FROM conversations
       WHERE space_id = $1 AND type = 'channel' AND deleted_at IS NULL
       AND ($2::boolean OR EXISTS (
         SELECT 1 FROM conversation_members cm
         WHERE cm.conversation_id = conversations.id
           AND cm.user_id = $3 AND cm.left_at IS NULL
       ))
       ORDER BY position ASC`,
      [spaceId, canManage, userId],
    ),
  ]);

  const space = spaceResult.rows[0];
  if (!space) {
    return null;
  }

  const categories = categoriesResult.rows;
  const channels = channelsResult.rows;

  const categorized = categories.map((category) => ({
    ...category,
    channels: channels.filter((c) => c.category_id === category.id),
  }));

  const uncategorized = channels.filter((c) => c.category_id === null);

  return {
    ...space,
    categories: categorized,
    uncategorized_channels: uncategorized,
  };
};

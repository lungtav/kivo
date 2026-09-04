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

export const listSpaceMembers = async (spaceId: string) => {
  const result = await db.query(
    `SELECT sm.user_id, sm.role, u.display_name, u.username, u.avatar_url
     FROM space_members sm
     JOIN users u ON u.id = sm.user_id
     WHERE sm.space_id = $1 AND sm.left_at IS NULL AND u.deleted_at IS NULL
     ORDER BY u.display_name ASC`,
    [spaceId],
  );
  return result.rows;
};

export const updateMemberRole = async (
  spaceId: string,
  userId: string,
  role: "admin" | "member",
) => {
  const result = await db.query(
    `UPDATE space_members SET role = $3
     WHERE space_id = $1 AND user_id = $2 AND left_at IS NULL
     RETURNING user_id, role`,
    [spaceId, userId, role],
  );
  return result.rows[0] ?? null;
};

export const removeMember = async (spaceId: string, userId: string) => {
  const result = await db.query(
    `UPDATE space_members SET left_at = NOW()
     WHERE space_id = $1 AND user_id = $2 AND left_at IS NULL
     RETURNING user_id`,
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
      `SELECT c.id, c.name, c.type, c.position, c.category_id,
        (
          SELECT COUNT(*)::int FROM messages m
          WHERE m.conversation_id = c.id
            AND m.deleted_at IS NULL
            AND m.sender_id <> $3
            AND (cm.last_read_message_id IS NULL OR m.created_at > COALESCE(
              (SELECT marker.created_at FROM messages marker WHERE marker.id = cm.last_read_message_id),
              to_timestamp(0)
            ))
        ) AS unread_count
       FROM conversations c
       LEFT JOIN conversation_members cm
         ON cm.conversation_id = c.id AND cm.user_id = $3 AND cm.left_at IS NULL
       WHERE c.space_id = $1 AND c.type = 'channel' AND c.deleted_at IS NULL
       AND ($2::boolean OR EXISTS (
         SELECT 1 FROM conversation_members cm2
         WHERE cm2.conversation_id = c.id
           AND cm2.user_id = $3 AND cm2.left_at IS NULL
       ))
       ORDER BY c.position ASC`,
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

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

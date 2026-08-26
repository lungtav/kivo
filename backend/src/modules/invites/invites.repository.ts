import { db } from "../../config/database.js";

export const createInvite = async (
  spaceId: string,
  createdBy: string,
  code: string,
  maxUses: number | null,
  expiresAt: Date | null,
) => {
  const result = await db.query(
    `INSERT INTO space_invites (space_id, code, created_by, max_uses, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, space_id, code, max_uses, uses_count, expires_at, revoked_at, created_at`,
    [spaceId, code, createdBy, maxUses, expiresAt],
  );
  return result.rows[0];
};

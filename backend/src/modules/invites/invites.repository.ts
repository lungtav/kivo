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

export const redeemInvite = async (code: string, userId: string) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    console.log(code)
    const inviteResult = await client.query(
      `SELECT * FROM space_invites WHERE code = $1 FOR UPDATE`,
      [code],
    );
    const invite = inviteResult.rows[0];

    if (!invite) {
      await client.query("ROLLBACK");
      return { status: "not_found" as const };
    }
    if (invite.revoked_at) {
      await client.query("ROLLBACK");
      return { status: "revoked" as const };
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return { status: "expired" as const };
    }
    if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
      await client.query("ROLLBACK");
      return { status: "exhausted" as const };
    }

    const existing = await client.query(
      `SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [invite.space_id, userId],
    );
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return { status: "already_member" as const, spaceId: invite.space_id };
    }

    await client.query(
      `INSERT INTO space_members (space_id, user_id, role) VALUES ($1, $2, 'member')`,
      [invite.space_id, userId],
    );
    await client.query(
      `UPDATE space_invites SET uses_count = uses_count + 1 WHERE id = $1`,
      [invite.id],
    );

    await client.query("COMMIT");
    return { status: "joined" as const, spaceId: invite.space_id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

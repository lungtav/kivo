import { db } from "../../config/database.js";
import type {
  CreateUserInput,
  CreateVerificationTokenInput,
} from "./auth.types.js";

export const findUser = async (email: string, username: string) => {
  const userResult = await db.query(
    `
    SELECT id, email, username FROM users
    WHERE deleted_at IS NULL
    AND (email=$1 OR username =$2 )
    LIMIT 1
    `,
    [email, username],
  );

  return userResult.rows[0];
};
export const findUserByEmail = async (email: string) => {
  const userResult = await db.query(
    `
    SELECT id, email, username, display_name,email_verified_at, password_hash FROM users
    WHERE deleted_at IS NULL
    AND email=$1
    LIMIT 1
    `,
    [email],
  );
  return userResult.rows[0];
};

export const findUserById = async (id: string) => {
  const userResult = await db.query(
    `
    SELECT id, email, username, display_name, email_verified_at FROM users
    WHERE deleted_at IS NULL
    AND id = $1
    LIMIT 1
    `,
    [id],
  );
  return userResult.rows[0];
};

export const createUser = async (input: CreateUserInput) => {
  const { email, username, password_hash, display_name } = input;

  const userResult = await db.query(
    `
        INSERT INTO users (email, username, password_hash, display_name) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, display_name
        `,
    [email, username, password_hash, display_name],
  );

  return userResult.rows[0];
};

export const storeVerificationToken = async (
  input: CreateVerificationTokenInput,
) => {
  const { user_id, token_hash } = input;

  await db.query(
    `
        INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) 
        VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
    [user_id, token_hash],
  );
};

export const replaceVerificationToken = async (
  userId: string,
  tokenHash: string,
) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE email_verification_tokens
        SET used_at = NOW()
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [userId],
    );

    await client.query(
      `
        INSERT INTO email_verification_tokens (
          user_id,
          token_hash,
          expires_at
        )
        VALUES (
          $1,
          $2,
          NOW() + INTERVAL '10 minutes'
        )
      `,
      [userId, tokenHash],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findVerificationToken = async (tokenHash: string) => {
  const tokenResult = await db.query(
    `
    SELECT id, expires_at, used_at, user_id FROM email_verification_tokens
    WHERE token_hash =$1
    LIMIT 1
    `,
    [tokenHash],
  );

  return tokenResult.rows[0];
};

export const findActiveVerificationToken = async (tokenHash: string) => {
  const tokenResult = await db.query(
    `
    SELECT id, expires_at, used_at, user_id FROM email_verification_tokens
    WHERE token_hash = $1
      AND expires_at > CURRENT_TIMESTAMP
    LIMIT 1
    `,
    [tokenHash],
  );

  return tokenResult.rows[0];
};

export const verifyEmail = async (userId: string, tokenId: string) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
   UPDATE users
   SET email_verified_at = NOW()
   WHERE id =$1
   AND email_verified_at IS NULL
    `,
      [userId],
    );

    await client.query(
      `
  UPDATE email_verification_tokens
  SET used_at = NOW()
  WHERE id = $1
  AND used_at IS NULL`,
      [tokenId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findRefreshToken = async (tokenHash: string) => {
  const result = await db.query(
    `
      SELECT
        id,
        user_id,
        session_id,
        token_hash,
        expires_at,
        revoked_at
      FROM refresh_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
};

export const rotateRefreshToken = async ({
  oldTokenId,
  user_id,
  session_id,
  token_hash,
  expires_at,
}: {
  oldTokenId: string;
  user_id: string;
  session_id: string;
  token_hash: string;
  expires_at: Date;
}) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE id = $1
          AND revoked_at IS NULL
      `,
      [oldTokenId],
    );

    await client.query(
      `
        INSERT INTO refresh_tokens (
          user_id,
          token_hash,
          session_id,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
      `,
      [user_id, token_hash, session_id, expires_at],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const revokeRefreshTokenByHash = async (tokenHash: string) => {
  const result = await db.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
      RETURNING id
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
};

export const createRefreshToken = async ({
  user_id,
  token_hash,
  session_id,
  expires_at,
}: {
  user_id: string;
  token_hash: string;
  session_id: string;
  expires_at: Date;
}) => {
  const result = await db.query(
    `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        session_id,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        session_id,
        expires_at,
        created_at
    `,
    [user_id, token_hash, session_id, expires_at],
  );

  return result.rows[0];
};

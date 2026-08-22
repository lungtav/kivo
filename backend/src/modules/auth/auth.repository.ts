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

  //expiration ()
  const EXPIRE_DURATION = 10 * 60 * 1000;
  const expires_at = new Date(Date.now() + EXPIRE_DURATION);

  await db.query(
    `
        INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) 
        VALUES ($1, $2 ,$3)`,
    [user_id, token_hash, expires_at],
  );
};

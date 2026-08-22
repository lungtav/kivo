import type { RegisterUserInput } from "./auth.types.js";
import * as authRepository from "./auth.repository.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";
import { hash } from "../../shared/utils/hash.js";
import { generateVerificationToken } from "../../shared/utils/tokens.js";
import { emailQueue } from "../../infrastructure/queue/queues/email-queue.js";
import { env } from "../../config/env.js";

export const register = async (input: RegisterUserInput) => {
  console.time("register Service");
  const { email, username, password, display_name } = input;

  //check if email exists already
  console.time("check existing user");
  const existingUser = await authRepository.findUser(email, username);
  console.timeEnd("check existing user");

  //if user exists
  if (existingUser) {
    throw new ConflictError(
      "an account with this email or username already exists",
    );
  }

  //if user doesn't exist

  //hash password
  console.time("hash password");
  const password_hash = await hash(password);
  console.timeEnd("hash password");

  //create user
  let createdUser;
  try {
    console.time("create user");
    createdUser = await authRepository.createUser({
      email,
      username,
      password_hash,
      display_name,
    });
    console.timeEnd("create user");
  } catch (error: any) {
    if (error.code === 23505) {
      throw new ConflictError(
        "an account with this email or username already exists",
      );
    }
    throw error;
  }

  //generate verification code
  console.time("generate and hash verification code");
  const { rawToken, tokenHash } = generateVerificationToken();
  console.timeEnd("generate and hash verification code");

  //store email verification token table
  console.time("store verification token");
  await authRepository.storeVerificationToken({
    user_id: createdUser.id,
    token_hash: tokenHash,
  });
  console.timeEnd("store verification token");

  //queue email
  console.time("add email to queue");
  await emailQueue.add(
    "send_verification_email",
    {
      email,
      display_name: createdUser.display_name,
      verify_url: `${env.APP_URL}/verify-email?token=${rawToken}`,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
  console.timeEnd("add email to queue");

  console.timeEnd("register Service");

  return createdUser;
};

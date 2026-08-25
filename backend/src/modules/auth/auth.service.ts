import { createHash, randomUUID } from "crypto";
import { db } from "../../config/database.js";
import type { RegisterUserInput, LoginInput } from "./auth.types.js";
import * as authRepository from "./auth.repository.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";
import { hash, compare } from "../../shared/utils/hash.js";
import {
  generateVerificationToken,
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/tokens.js";
import { emailQueue } from "../../infrastructure/queue/queues/email-queue.js";
import { env } from "../../config/env.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";

export const register = async (input: RegisterUserInput) => {
  const { email, username, password, display_name } = input;

  //check if email exists already
  const existingUser = await authRepository.findUser(email, username);

  //if user exists
  if (existingUser) {
    throw new ConflictError(
      "an account with this email or username already exists",
    );
  }

  //if user doesn't exist

  //hash password
  const password_hash = await hash(password);

  //create user
  let createdUser;
  try {
    createdUser = await authRepository.createUser({
      email,
      username,
      password_hash,
      display_name,
    });
  } catch (error: any) {
    if (error.code === 23505) {
      throw new ConflictError(
        "an account with this email or username already exists",
      );
    }
    throw error;
  }

  //generate verification code
  const { rawToken, tokenHash } = generateVerificationToken();
  console.log(rawToken);

  //store email verification token table
  await authRepository.storeVerificationToken({
    user_id: createdUser.id,
    token_hash: tokenHash,
  });

  //queue email
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

  return createdUser;
};

export const login = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.email_verified_at) {
    throw new UnauthorizedError("Please verify your email first");
  }

  const passwordValid = await compare(password, user.password_hash);

  if (!passwordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const accessToken = generateAccessToken(user.id);

  const { rawToken, tokenHash } = generateRefreshToken();

  const sessionId = randomUUID();

  await authRepository.createRefreshToken({
    user_id: user.id,
    token_hash: tokenHash,
    session_id: sessionId,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken: rawToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
    },
  };
};

export const refresh = async (rawRefreshToken: string) => {
  const tokenHash = createHash("sha256").update(rawRefreshToken).digest("hex");

  const storedToken = await authRepository.findRefreshToken(tokenHash);

  if (!storedToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (storedToken.revoked_at) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }

  if (new Date(storedToken.expires_at) <= new Date()) {
    throw new UnauthorizedError("Refresh token has expired");
  }

  const accessToken = generateAccessToken(storedToken.user_id);

  const { rawToken: newRawToken, tokenHash: newTokenHash } =
    generateRefreshToken();

  await authRepository.rotateRefreshToken({
    oldTokenId: storedToken.id,
    user_id: storedToken.user_id,
    session_id: storedToken.session_id,
    token_hash: newTokenHash,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken: newRawToken,
  };
};

export const verifyEmail = async (token: string) => {
  //hash token
  const tokenHash = createHash("sha256").update(token).digest("hex");

  //find token
  const verificationToken =
    await authRepository.findVerificationToken(tokenHash);

  if (!verificationToken) {
    throw new ValidationError("invalid or expired link");
  }

  if (verificationToken.used_at) {
    return;
  }

  if (new Date() > verificationToken.expires_at) {
    throw new ValidationError("invalid or expired link");
  }

  //update user table
  await authRepository.verifyEmail(
    verificationToken.user_id,
    verificationToken.id,
  );
};

export const resendVerification = async (email: string) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new ValidationError("Unable to resend verification email");
  }

  await resendVerificationForUser(user);
};

export const resendVerificationFromToken = async (rawToken: string) => {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const verificationToken = await authRepository.findVerificationToken(tokenHash);

  if (!verificationToken) {
    throw new ValidationError("Unable to resend verification email");
  }

  const user = await authRepository.findUserById(verificationToken.user_id);
  if (!user) {
    throw new ValidationError("Unable to resend verification email");
  }

  await resendVerificationForUser(user);
};

const resendVerificationForUser = async (user: {
  id: string;
  email: string;
  display_name: string;
  email_verified_at: Date | null;
}) => {
  if (user.email_verified_at) {
    throw new ConflictError("Email is already verified");
  }

  const { rawToken, tokenHash } = generateVerificationToken();

  await authRepository.replaceVerificationToken(user.id, tokenHash);

  //queue email
  await emailQueue.add(
    "send_verification_email",
    {
      email: user.email,
      display_name: user.display_name,
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
};

export const logout = async (rawRefreshToken: string) => {
  const tokenHash = createHash("sha256").update(rawRefreshToken).digest("hex");

  await authRepository.revokeRefreshTokenByHash(tokenHash);
};

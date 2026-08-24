import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
};

export const generateAccessToken = (userId: string) => {
  return jwt.sign(
    {
      sub: userId,
    },
    env.JWT_SECRET_KEY,
    {
      expiresIn: "15m",
    },
  );
};

export const generateRefreshToken = () => {
  const rawToken = crypto.randomBytes(64).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    tokenHash,
  };
};

import bcrypt from "bcrypt";
// src/modules/auth/auth.service.ts
import crypto from "crypto";

export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex"); // sent to user
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex"); // stored in DB
  return { rawToken, tokenHash };
};

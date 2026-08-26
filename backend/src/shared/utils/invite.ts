import crypto from "crypto";

export function generateInviteCode() {
  return crypto.randomBytes(6).toString("base64url");
}

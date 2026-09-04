import type { CreateInviteInput } from "./invites.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ForbiddenError } from "../../shared/errors/ForbiddenError.js";
import * as spacesRepository from "../spaces/spaces.repository.js";
import * as invitesRepository from "./invites.repository.js";
import { generateInviteCode } from "../../shared/utils/invite.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";
import { AppError } from "../../shared/errors/AppError.js";

export const createInvite = async (
  spaceId: string,
  userId: string,
  options: CreateInviteInput,
) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can create invites");
  }

  const code = generateInviteCode();
  const expiresAt = options.expiresInHours
    ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
    : null;

  return invitesRepository.createInvite(
    spaceId,
    userId,
    code,
    options.maxUses ?? null,
    expiresAt,
  );
};

export const joinSpace = async (code: string, userId: string) => {
  const result = await invitesRepository.redeemInvite(code, userId);

  switch (result.status) {
    case "joined":
      return { spaceId: result.spaceId };
    case "already_member":
      throw new ConflictError("you're already in this space");
    case "not_found":
      throw new NotFoundError("invite not found");
    case "revoked":
      throw new AppError(410, "INVITE_REVOKED", "this invite has been revoked");
    case "expired":
      throw new AppError(410, "INVITE_EXPIRED", "this invite has expired");
    case "exhausted":
      throw new AppError(
        410,
        "INVITE_EXHAUSTED",
        "this invite has reached its limit",
      );
  }
};

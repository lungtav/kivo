import type { CreateInviteInput } from "./invites.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ForbiddenError } from "../../shared/errors/ForbiddenError.js";
import * as spacesRepository from "../spaces/spaces.repository.js";
import * as invitesRepository from "./invites.repository.js";
import { generateInviteCode } from "../../shared/utils/invite.js";

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

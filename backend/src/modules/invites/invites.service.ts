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

export const listInvites = async (spaceId: string, userId: string) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can view invites");
  }
  return invitesRepository.listInvitesForSpace(spaceId);
};

export const revokeInvite = async (inviteId: string, userId: string) => {
  const invite = await invitesRepository.findInviteById(inviteId);
  if (!invite) {
    throw new NotFoundError("invite not found");
  }
  const membership = await spacesRepository.getMembership(invite.space_id, userId);
  if (!membership) {
    throw new NotFoundError("invite not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can revoke invites");
  }
  const revoked = await invitesRepository.revokeInvite(inviteId);
  if (!revoked) {
    throw new NotFoundError("invite not found");
  }
};

export const previewInvite = async (code: string) => {
  const invite = await invitesRepository.findInvitePreviewByCode(code);
  if (!invite) {
    throw new NotFoundError("invite not found");
  }
  // non-404 states ride along as 200 so the join page can explain them;
  // only unknown codes are a 404
  const status = invite.revoked_at
    ? ("revoked" as const)
    : invite.expires_at && new Date(invite.expires_at) < new Date()
      ? ("expired" as const)
      : invite.max_uses !== null && invite.uses_count >= invite.max_uses
        ? ("exhausted" as const)
        : ("valid" as const);
  return {
    status,
    space: {
      id: invite.space_id as string,
      name: invite.space_name as string,
      avatar_url: (invite.space_avatar_url ?? null) as string | null,
    },
    memberCount: invite.member_count as number,
    maxUses: (invite.max_uses ?? null) as number | null,
    usesCount: invite.uses_count as number,
    expiresAt: (invite.expires_at ?? null) as string | null,
  };
};

export const joinSpace = async (code: string, userId: string) => {  const result = await invitesRepository.redeemInvite(code, userId);

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

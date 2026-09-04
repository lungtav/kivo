import * as spacesRepository from "./spaces.repository.js";
import type { UpdateSpaceInput } from "./spaces.types.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";
import { ForbiddenError } from "../../shared/errors/ForbiddenError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

const PG_UNIQUE_VIOLATION = "23505";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export const createSpace = async (userId: string, name: string) => {
  const slug = slugify(name);

  try {
    const space = await spacesRepository.createSpace(name, slug, userId);
    return space;
  } catch (error: any) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(
        "a space with a similar name already exists, try again",
      );
    }

    throw error;
  }
};

export const updateSpaceDetails = async (
  spaceId: string,
  userId: string,
  input: UpdateSpaceInput,
) => {
  const space = await spacesRepository.findSpaceById(spaceId);
  if (!space) {
    throw new NotFoundError("space not found");
  }

  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can update this space");
  }

  const updated = await spacesRepository.updateSpace(spaceId, input);
  if (!updated) {
    throw new NotFoundError("space not found");
  }

  return updated;
};

export const listSpaces = async (userId: string) => {
  return spacesRepository.listSpacesForUser(userId);
};

export const listMembers = async (spaceId: string, userId: string) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  return spacesRepository.listSpaceMembers(spaceId);
};

export const changeMemberRole = async (
  spaceId: string,
  actorId: string,
  targetUserId: string,
  role: "admin" | "member",
) => {
  const membership = await spacesRepository.getMembership(spaceId, actorId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can manage members");
  }
  const target = await spacesRepository.getMembership(spaceId, targetUserId);
  if (!target) {
    throw new NotFoundError("member not found");
  }
  if (target.role === "owner") {
    throw new ForbiddenError("the space owner's role cannot be changed");
  }
  return spacesRepository.updateMemberRole(spaceId, targetUserId, role);
};

export const kickMember = async (
  spaceId: string,
  actorId: string,
  targetUserId: string,
) => {
  const membership = await spacesRepository.getMembership(spaceId, actorId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can remove members");
  }
  const target = await spacesRepository.getMembership(spaceId, targetUserId);
  if (!target) {
    throw new NotFoundError("member not found");
  }
  if (target.role === "owner") {
    throw new ForbiddenError("the space owner cannot be removed");
  }
  await spacesRepository.removeMember(spaceId, targetUserId);
};

export const leaveSpace = async (spaceId: string, userId: string) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role === "owner") {
    throw new ForbiddenError("owners cannot leave their space — delete it instead");
  }
  await spacesRepository.removeMember(spaceId, userId);
};

export const getSpace = async (spaceId: string, userId: string) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }

  const space = await spacesRepository.getSpaceStructure(
    spaceId,
    userId,
    membership.role === "owner" || membership.role === "admin",
  );
  if (!space) {
    throw new NotFoundError("space not found");
  }

  return { ...space, role: membership.role };
};

export const deleteSpace = async (spaceId: string, userId: string) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) throw new NotFoundError("space not found");
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can delete this space");
  }
  await spacesRepository.deleteSpace(spaceId);
};

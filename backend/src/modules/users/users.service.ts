import type { UpdateProfileInput } from "./users.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";
import * as usersRepository from "./users.repository.js";
import { findDirectConversation } from "../conversations/conversations.repository.js";

const PG_UNIQUE_VIOLATION = "23505";

export const getProfile = async (userId: string) => {
  const profile = await usersRepository.findProfileById(userId);
  if (!profile) {
    throw new NotFoundError("user not found");
  }
  return profile;
};

export const getPublicProfile = async (requesterId: string, targetUserId: string) => {
  // profiles are visible to yourself and to people who share a space with you
  const isSelf = requesterId === targetUserId;
  if (!isSelf && !(await usersRepository.sharesSpaceWith(requesterId, targetUserId))) {
    throw new NotFoundError("user not found");
  }

  const profile = await usersRepository.findProfileById(targetUserId);
  if (!profile) {
    throw new NotFoundError("user not found");
  }

  const [commonSpaces, commonGroups, direct] = await Promise.all([
    usersRepository.findCommonSpaces(requesterId, targetUserId),
    usersRepository.findCommonGroups(requesterId, targetUserId),
    isSelf ? Promise.resolve(null) : findDirectConversation(requesterId, targetUserId),
  ]);

  // email only ever goes back to the account owner
  const { email: _email, ...publicUser } = profile;
  return {
    user: isSelf ? profile : publicUser,
    commonSpaces,
    commonGroups,
    directConversationId: direct?.id ?? null,
  };
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  if (input.username !== undefined) {
    const taken = await usersRepository.findUsernameTaken(input.username, userId);
    if (taken) {
      throw new ConflictError("that username is already taken");
    }
  }

  try {
    const updated = await usersRepository.updateProfile(userId, input);
    if (!updated) {
      throw new NotFoundError("user not found");
    }
    return updated;
  } catch (error: any) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError("that username is already taken");
    }
    throw error;
  }
};

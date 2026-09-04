import type { UpdateProfileInput } from "./users.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";
import * as usersRepository from "./users.repository.js";

const PG_UNIQUE_VIOLATION = "23505";

export const getProfile = async (userId: string) => {
  const profile = await usersRepository.findProfileById(userId);
  if (!profile) {
    throw new NotFoundError("user not found");
  }
  return profile;
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

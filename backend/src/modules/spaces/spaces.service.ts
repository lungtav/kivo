import * as spacesRepository from "./spaces.repository.js";
import { ConflictError } from "../../shared/errors/ConflictError.js";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

const PG_UNIQUE_VIOLATION = "23505";

export const createSpace = async (userId: string, name: string) => {
  const slug = slugify(name);
  console.log(slug);

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

import type { CreateCategoryInput } from "./categories.types.js";
import * as spacesRepository from "../spaces/spaces.repository.js";
import * as categoriesRepository from "../categories/categories.repository.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ForbiddenError } from "../../shared/errors/ForbiddenError.js";

async function requireSpaceAdmin(spaceId: string, userId: string) {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can manage categories");
  }
  return membership;
}

export const createCategory = async (
  spaceId: string,
  userId: string,
  input: CreateCategoryInput,
) => {
  await requireSpaceAdmin(spaceId, userId);
  const nextPosition = (await categoriesRepository.getMaxPosition(spaceId)) + 1;
  return categoriesRepository.createCategory(spaceId, input.name, nextPosition);
};

export const deleteCategory = async (categoryId: string, userId: string) => {
  const category = await categoriesRepository.findCategoryById(categoryId);
  if (!category) throw new NotFoundError("category not found");
  await requireSpaceAdmin(category.space_id, userId);
  await categoriesRepository.deleteCategory(categoryId);
};

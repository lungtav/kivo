import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { CreateCategorySchema } from "./categories.schema.js";
import type { CreateCategoryInput } from "./categories.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import * as categoriesService from "./categories.service.js";

export const createCategory = asyncHandler(
  async (
    req: Request<{ spaceId: string }, {}, CreateCategoryInput>,
    res: Response,
  ) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = CreateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const category = await categoriesService.createCategory(
      req.params.spaceId,
      userId,
      parsed.data,
    );
    res
      .status(201)
      .json({ message: "category created successfully", category });
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request<{ categoryId: string }>, res: Response) => {
    await categoriesService.deleteCategory(req.params.categoryId, req.user.id);
    res.status(204).send();
  },
);

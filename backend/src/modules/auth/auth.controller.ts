import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { RegisterUserSchema } from "./auth.schema.js";
import type { RegisterUserInput } from "./auth.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(
  async (req: Request<{}, {}, RegisterUserInput>, res: Response) => {
    const parsed = RegisterUserSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const createdUser = await authService.register(parsed.data);

    res
      .status(201)
      .json({ message: "User created successfully", user: createdUser });
  },
);

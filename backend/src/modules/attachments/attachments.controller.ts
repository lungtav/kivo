import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { getUploadUrl } from "../../infrastructure/storage/client.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { requestUploadSchema } from "./attachments.schema.js";
import type { RequestUploadInput } from "./attachments.types.js";

export const requestUpload = asyncHandler(
  async (req: Request<{}, {}, RequestUploadInput>, res: Response) => {
    if (req.user.id) {
      throw new ValidationError("unauthorized access");
    }

    const parsed = requestUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const { uploadUrl, storageKey } = await getUploadUrl(
      req.user.id,
      parsed.data.mimeType,
    );

    res.status(201).json({ uploadUrl, storageKey });
  },
);

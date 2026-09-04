import { asyncHandler } from "../../middleware/async-handler.js";
import type { Request, Response } from "express";
import { getUploadUrl } from "../../infrastructure/storage/client.js";
import { UnauthorizedError } from "../../shared/errors/UnauthorizedError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { requestUploadSchema } from "./attachments.schema.js";
import * as attachmentsService from "./attachments.service.js";
import type { RequestUploadInput } from "./attachments.types.js";

export const requestUpload = asyncHandler(
  async (req: Request<{}, {}, RequestUploadInput>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const parsed = requestUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(message);
    }

    const { uploadUrl, storageKey } = await getUploadUrl(
      userId,
      parsed.data.mimeType,
    );

    res.status(201).json({ uploadUrl, storageKey });
  },
);

export const getAttachmentUrl = asyncHandler(
  async (req: Request<{ attachmentId: string }>, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedError("unauthorized access");
    }

    const { readUrl } = await attachmentsService.getAttachmentReadUrl(
      req.params.attachmentId,
      userId,
    );
    res.status(200).json({ readUrl });
  },
);

import {
  getAttachmentUrl,
  requestUpload,
} from "../modules/attachments/attachments.controller.js";
import { Router } from "express";

const attachmentsRouter = Router();

attachmentsRouter.post("/upload-url", requestUpload);
attachmentsRouter.get("/:attachmentId/url", getAttachmentUrl);

export { attachmentsRouter };

import { requestUpload } from "../modules/attachments/attachments.controller.js";
import { Router } from "express";

const attachmentsRouter = Router();

attachmentsRouter.post("/upload-url", requestUpload);

export { attachmentsRouter };

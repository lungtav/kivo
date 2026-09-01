import * as z from "zod";
import { requestUploadSchema } from "./attachments.schema.js";

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

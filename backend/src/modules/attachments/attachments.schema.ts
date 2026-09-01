import * as z from "zod";
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

export const requestUploadSchema = z.object({
  mimeType: z.string().refine((type) => ALLOWED_MIME_TYPES.has(type), {
    message: "unsupported file type",
  }),
});

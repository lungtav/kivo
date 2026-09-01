import * as z from "zod";


export const CreateMessageSchema = z.object({
  content: z.string().trim().optional(),

  replyToId: z.string().uuid().optional(),

  attachments: z
    .array(
      z.object({
        mediaType: z.enum(["text", "media", "system"]),
        storageKey: z.string(),
        mimeType: z.string(),
        fileSizeBytes: z.number().positive().optional(),
      }),
    )
    .optional(),
});
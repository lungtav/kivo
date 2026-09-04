import * as z from "zod";


export const CreateMessageSchema = z.object({
  content: z.string().trim().optional(),

  replyToId: z.string().uuid().optional(),

  attachments: z
    .array(
      z.object({
        storageKey: z.string().min(1),
        mimeType: z.string().min(1),
        fileSizeBytes: z.number().positive().optional(),
      }),
    )
    .optional(),
});

export const GetMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().uuid().optional(),
});
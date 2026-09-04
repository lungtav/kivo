import * as z from "zod";

export const CreateChannelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryId: z.string().uuid().optional(),
});

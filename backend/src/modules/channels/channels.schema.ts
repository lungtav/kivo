import * as z from "zod";

export const CreateChannelSchema = z.object({
  name: z.string(),
  categoryId: z.string().optional(),
});

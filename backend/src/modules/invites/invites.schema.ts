import * as z from "zod";

export const CreateInviteSchema = z.object({
  maxUses: z.number().optional(),
  expiresInHours: z.number().optional(),
});

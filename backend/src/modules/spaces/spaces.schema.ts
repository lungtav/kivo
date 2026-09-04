import * as z from "zod";
export const CreateSpaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export const UpdateSpaceSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    avatar_url: z.string().url().optional(),
    bio: z.string().max(100).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field must be provided",
  });

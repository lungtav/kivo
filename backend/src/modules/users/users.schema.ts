import * as z from "zod";

export const UpdateProfileSchema = z
  .object({
    display_name: z.string().trim().min(1).max(100).optional(),
    username: z.string().trim().min(3).max(30).optional(),
    avatar_url: z.string().url().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field must be provided",
  });

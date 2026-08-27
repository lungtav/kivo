import * as z from "zod";

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "category name has to be a least one character")
    .max(100, "category must be 100 characters or less"),
});

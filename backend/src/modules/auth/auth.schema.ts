import * as z from "zod";

export const RegisterUserSchema = z.object({
  email: z.email("Enter a valid email address").max(255, "Email is too long").toLowerCase(),
  username: z
    .string()
    .min(3, "username must be at least 3 characters ")
    .max(30, "Username must be at most 100 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be at most 100 characters"),
});

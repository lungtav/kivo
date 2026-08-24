import z from "zod";
import { RegisterUserSchema, LoginSchema } from "./auth.schema.js";

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export interface CreateUserInput {
  email: string;
  username: string;
  password_hash: string;
  display_name: string;
}

export interface CreateVerificationTokenInput {
  user_id: string;
  token_hash: string;
}

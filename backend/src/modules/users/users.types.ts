import { UpdateProfileSchema } from "./users.schema.js";
import * as z from "zod";

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

import { UpdateSpaceSchema } from "./spaces.schema.js";
import * as z from "zod";

export interface CreateSpaceInput {
  name: string;
}

export type UpdateSpaceInput = z.infer<typeof UpdateSpaceSchema>;

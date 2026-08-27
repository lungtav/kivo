import * as z from "zod";
import { CreateCategorySchema } from "./categories.schema.js";

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

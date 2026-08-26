import { CreateInviteSchema } from "./invites.schema.js";
import * as z from "zod";

export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

import { CreateConversationSchema } from "./conversations.schema.js";
import * as z from "zod";

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

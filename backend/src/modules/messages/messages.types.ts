import { CreateMessageSchema, GetMessagesQuerySchema } from "./messages.schema.js";
import * as z from "zod";

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type GetMessagesQueryInput = z.infer<typeof GetMessagesQuerySchema>;

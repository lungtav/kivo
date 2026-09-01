import { CreateMessageSchema } from "./messages.schema.js";
import * as z from "zod";

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export interface GetMessageQuery {
  limit?: string;
  before?: string;
}

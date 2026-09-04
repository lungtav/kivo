import * as z from "zod";

export const CreateConversationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("dm"),
    userId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("group_dm"),
    name: z.string().trim().min(1).max(100),
    memberIds: z.array(z.string().uuid()).max(50).default([]),
  }),
]);

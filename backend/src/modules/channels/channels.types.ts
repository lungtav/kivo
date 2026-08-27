import * as z from "zod";

import { CreateChannelSchema } from "./channels.schema.js";

export type CreateChannelInput = z.infer<typeof CreateChannelSchema>
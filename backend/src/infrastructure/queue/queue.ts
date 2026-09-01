import { redis } from "../redis/redis.client.js";
import { Queue } from "bullmq";

export const emailQueue = new Queue("email", { connection: redis });
export const mediaQueue = new Queue("media", { connection: redis });

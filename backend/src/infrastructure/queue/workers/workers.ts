import { emailWorker } from "./email.worker.js";
import { mediaWorker } from "./media.worker.js";
import { redis } from "../../redis/redis.client.js";
import { db } from "../../../config/database.js";

console.log("Workers started: email, media");

const shutdown = async () => {
  console.log("Workers shutting down…");
  await Promise.allSettled([emailWorker.close(), mediaWorker.close()]);
  redis.disconnect();
  await db.end().catch(() => {});
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

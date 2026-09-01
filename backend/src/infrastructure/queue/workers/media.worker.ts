import { Worker } from "bullmq";
import { redis } from "../../redis/redis.client.js";
import {
  findAttachmentByMessageId,
  updateProcessingResult,
} from "../../../modules/attachments/attachments.repository.js";
export const mediaWorker = new Worker(
  "media",
  async (job) => {
    if (job.name !== "process-attachment") return;

    const { attachmentId } = job.data;
    const attachment = await findAttachmentByMessageId(attachmentId);

    if (!attachment) return; // nothing to process, don't retry

    try {
      // placeholder — no real ffmpeg processing yet, just marking it ready
      await updateProcessingResult(attachmentId, { status: "ready" });
    } catch (error) {
      await updateProcessingResult(attachmentId, { status: "failed" });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3,
  },
);

mediaWorker.on("failed", (job, err) => {
  console.error(`media processing failed for job ${job?.id}:`, err.message);
});

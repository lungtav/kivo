import { Worker } from "bullmq";
import { redis } from "../../redis/redis.client.js";
import { verifyEmailTemplate } from "../../email/templates/verify-email.js";
import { sendEmail } from "../../email/mailer.js";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    if (job.name === "send_verification_email") {
      const { email, display_name, verify_url } = job.data;

      const { subject, html } = verifyEmailTemplate(display_name, verify_url);

      try {
        await sendEmail(email, subject, html);
      } catch (error) {
        throw new Error("email failed to send");
      }
    }
  },
  {
    connection: redis,
    concurrency: 10
  },
);

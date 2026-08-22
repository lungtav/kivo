import { resend } from "./client.js";

export class EmailError extends Error {}

export async function sendEmail(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: "Kivo <noreply@oluwafunmbi.cv>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new EmailError(error.message);
  }

  return data;
}

export function verifyEmailTemplate(display_name: string, verify_url: string) {
  return {
    subject: "Verify your email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111;">Hi ${display_name},</h2>
        <p style="color: #333; line-height: 1.5;">
          Thanks for signing up. Confirm your email address to activate your account.
        </p>
        <a href="${verify_url}"
           style="display: inline-block; background: #4f46e5; color: #fff;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: 600; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 13px;">
          This link expires in 10 minutes. If you didn't create this account, you can ignore this email.
        </p>
      </div>
    `,
  };
}

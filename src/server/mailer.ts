import "server-only";

/**
 * Email transport. The MVP has no email provider: in development the link is
 * logged to the server console. Plug a real provider (Resend, SES, …) here.
 */
export async function sendPasswordResetEmail(to: string, url: string) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`\n[mailer:dev] Password reset for ${to}\n  ${url}\n`);
    return;
  }
  console.warn("[mailer] No email provider configured — password reset email not sent.");
}

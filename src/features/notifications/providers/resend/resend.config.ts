/**
 * Resend credentials (RFC-019).
 * Secrets stay in env — never Firestore / Store Settings.
 */
export type ResendConfig = {
  apiKey: string;
};

export function getResendConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it to the server environment.",
    );
  }
  return { apiKey };
}

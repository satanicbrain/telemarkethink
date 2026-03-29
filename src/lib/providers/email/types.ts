export type EmailProviderKey = "resend";

export interface EmailProvider {
  key: EmailProviderKey;
  send(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{
    ok: boolean;
    providerMessageId?: string;
    raw?: unknown;
    error?: string;
  }>;
}

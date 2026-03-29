import { Resend } from "resend";
import { EmailProvider } from "./types";

type ResendConfig = {
  apiKey: string;
  fromEmail: string;
};

export class ResendProvider implements EmailProvider {
  key = "resend" as const;
  private client: Resend;

  constructor(private readonly config: ResendConfig) {
    this.client = new Resend(config.apiKey);
  }

  async send(input: { to: string; subject: string; html: string; text?: string }) {
    try {
      const response = await this.client.emails.send({
        from: this.config.fromEmail,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      } as any);

      if ((response as any)?.error) {
        return { ok: false, error: (response as any).error.message ?? "Resend send failed", raw: response };
      }

      return { ok: true, providerMessageId: (response as any)?.data?.id, raw: response };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Resend send failed" };
    }
  }
}

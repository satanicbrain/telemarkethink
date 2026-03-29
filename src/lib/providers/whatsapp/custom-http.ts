import { WhatsAppProvider, WhatsAppSendTemplateInput, WhatsAppSendTextInput } from "./types";

type CustomHttpConfig = {
  baseUrl: string;
  apiKey: string;
  sender?: string;
  extraHeadersJson?: string;
};

export class CustomHttpWhatsAppProvider implements WhatsAppProvider {
  key = "custom_http" as const;

  constructor(private readonly config: CustomHttpConfig) {}

  private get extraHeaders() {
    try {
      return this.config.extraHeadersJson ? JSON.parse(this.config.extraHeadersJson) : {};
    } catch {
      return {};
    }
  }

  async sendText(input: WhatsAppSendTextInput) {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        to: input.to,
        message: input.message,
        sender: this.config.sender,
        meta: input.meta ?? {},
      }),
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, raw, error: "Custom HTTP gateway send failed" };
    }

    return { ok: true, raw, providerMessageId: raw?.messageId ?? raw?.id };
  }

  async sendTemplate(input: WhatsAppSendTemplateInput) {
    return this.sendText({
      to: input.to,
      message: [input.templateName, ...(input.variables ?? [])].join(" | "),
      meta: input.meta,
    });
  }
}

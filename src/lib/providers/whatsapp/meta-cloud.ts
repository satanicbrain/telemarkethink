import { WhatsAppProvider, WhatsAppSendTemplateInput, WhatsAppSendTextInput } from "./types";

type MetaCloudConfig = {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
  graphApiVersion?: string;
};

export class MetaCloudProvider implements WhatsAppProvider {
  key = "meta_cloud_api" as const;

  constructor(private readonly config: MetaCloudConfig) {}

  private get baseUrl() {
    const version = this.config.graphApiVersion || "v23.0";
    return `https://graph.facebook.com/${version}/${this.config.phoneNumberId}/messages`;
  }

  async sendText(input: WhatsAppSendTextInput) {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to.replace(/[^\d]/g, ""),
        type: "text",
        text: { preview_url: false, body: input.message },
      }),
    });

    const raw = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        raw,
        error: raw?.error?.message ?? "Meta Cloud API sendText failed",
      };
    }

    return {
      ok: true,
      raw,
      providerMessageId: raw?.messages?.[0]?.id,
    };
  }

  async sendTemplate(input: WhatsAppSendTemplateInput) {
    const components = input.variables?.length
      ? [
          {
            type: "body",
            parameters: input.variables.map((value) => ({ type: "text", text: value })),
          },
        ]
      : undefined;

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/[^\d]/g, ""),
        type: "template",
        template: {
          name: input.templateName,
          language: { code: input.languageCode || "id" },
          ...(components ? { components } : {}),
        },
      }),
    });

    const raw = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        raw,
        error: raw?.error?.message ?? "Meta Cloud API sendTemplate failed",
      };
    }

    return {
      ok: true,
      raw,
      providerMessageId: raw?.messages?.[0]?.id,
    };
  }

  async normalizeWebhookEvent(payload: any) {
    const status = payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (status) {
      return {
        providerMessageId: status.id,
        status: status.status,
        eventType: "status",
        raw: payload,
      };
    }

    if (message) {
      return {
        providerMessageId: message.id,
        eventType: "inbound_message",
        raw: payload,
      };
    }

    return { eventType: "unknown", raw: payload };
  }
}

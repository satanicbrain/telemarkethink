export type WhatsAppProviderKey = "meta_cloud_api" | "twilio_whatsapp" | "custom_http";

export type WhatsAppSendTextInput = {
  to: string;
  message: string;
  meta?: Record<string, unknown>;
};

export type WhatsAppSendTemplateInput = {
  to: string;
  templateName: string;
  languageCode?: string;
  variables?: string[];
  meta?: Record<string, unknown>;
};

export type WhatsAppProviderResult = {
  ok: boolean;
  providerMessageId?: string;
  raw?: unknown;
  error?: string;
};

export interface WhatsAppProvider {
  key: WhatsAppProviderKey;
  sendText(input: WhatsAppSendTextInput): Promise<WhatsAppProviderResult>;
  sendTemplate?(input: WhatsAppSendTemplateInput): Promise<WhatsAppProviderResult>;
  normalizeWebhookEvent?(payload: unknown): Promise<{
    providerMessageId?: string;
    status?: string;
    eventType: string;
    raw: unknown;
  }>;
}

import twilio from "twilio";
import { normalizeToWhatsAppAddress } from "@/src/lib/utils/phone";
import { WhatsAppProvider, WhatsAppSendTemplateInput, WhatsAppSendTextInput } from "./types";

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  key = "twilio_whatsapp" as const;
  private client;

  constructor(private readonly config: TwilioConfig) {
    this.client = twilio(config.accountSid, config.authToken);
  }

  async sendText(input: WhatsAppSendTextInput) {
    try {
      const message = await this.client.messages.create({
        from: normalizeToWhatsAppAddress(this.config.fromNumber),
        to: normalizeToWhatsAppAddress(input.to),
        body: input.message,
      });

      return {
        ok: true,
        providerMessageId: message.sid,
        raw: message,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Twilio sendText failed",
      };
    }
  }

  async sendTemplate(input: WhatsAppSendTemplateInput) {
    const fallbackBody = [input.templateName, ...(input.variables ?? [])].join(" | ");
    return this.sendText({ to: input.to, message: fallbackBody, meta: input.meta });
  }

  async normalizeWebhookEvent(payload: any) {
    return {
      providerMessageId: payload?.MessageSid,
      status: payload?.MessageStatus ?? payload?.SmsStatus,
      eventType: payload?.Body ? "inbound_message" : "status",
      raw: payload,
    };
  }
}

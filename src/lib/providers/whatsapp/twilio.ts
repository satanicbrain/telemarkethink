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

  constructor(private readonly config: TwilioConfig) {}

  private getMissingFields() {
    const missing: string[] = [];
    if (!this.config.accountSid) missing.push("TWILIO_ACCOUNT_SID / accountSid");
    if (!this.config.authToken) missing.push("TWILIO_AUTH_TOKEN / authToken");
    if (!this.config.fromNumber) missing.push("TWILIO_WHATSAPP_FROM / fromNumber");
    return missing;
  }

  private createClient() {
    return twilio(this.config.accountSid, this.config.authToken);
  }

  async sendText(input: WhatsAppSendTextInput) {
    const missing = this.getMissingFields();
    if (missing.length) {
      return {
        ok: false,
        error: `Twilio settings belum lengkap: ${missing.join(", ")}`,
      };
    }

    try {
      const client = this.createClient();
      const message = await client.messages.create({
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

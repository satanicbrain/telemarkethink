import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getChannelSettingSecrets } from "@/src/lib/settings/repository";
import { CustomHttpWhatsAppProvider } from "./custom-http";
import { MetaCloudProvider } from "./meta-cloud";
import { TwilioWhatsAppProvider } from "./twilio";
import { WhatsAppProvider, WhatsAppProviderKey } from "./types";

function toProviderKey(value: unknown): WhatsAppProviderKey | null {
  if (value === "meta_cloud_api" || value === "twilio_whatsapp" || value === "custom_http") {
    return value;
  }
  return null;
}

export async function getActiveWhatsAppProvider(): Promise<{
  provider: WhatsAppProvider;
  providerKey: WhatsAppProviderKey;
  publicConfig: Record<string, unknown>;
}> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("provider_settings")
    .select("provider, public_config")
    .eq("channel", "whatsapp")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "WhatsApp provider could not be loaded.");
  }

  const envDefaultProvider = toProviderKey(process.env.WHATSAPP_DEFAULT_PROVIDER);
  const providerKey = toProviderKey(data?.provider) ?? envDefaultProvider;

  if (!providerKey) {
    throw new Error("WhatsApp provider is not configured.");
  }

  const secrets = await getChannelSettingSecrets("whatsapp").catch(() => ({}));
  const publicConfig = (data?.public_config as Record<string, unknown> | null) ?? {};

  switch (providerKey) {
    case "meta_cloud_api":
      return {
        provider: new MetaCloudProvider({
          accessToken: String((secrets as any)?.accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN ?? ""),
          phoneNumberId: String(publicConfig.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? ""),
          businessAccountId: String(publicConfig.businessAccountId ?? process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? ""),
          webhookVerifyToken: String((secrets as any)?.webhookVerifyToken ?? process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? ""),
          graphApiVersion: String(publicConfig.graphApiVersion ?? process.env.WHATSAPP_GRAPH_API_VERSION ?? "v23.0"),
        }),
        providerKey: "meta_cloud_api",
        publicConfig,
      };

    case "twilio_whatsapp":
      return {
        provider: new TwilioWhatsAppProvider({
          accountSid: String(publicConfig.accountSid ?? process.env.TWILIO_ACCOUNT_SID ?? ""),
          authToken: String((secrets as any)?.authToken ?? process.env.TWILIO_AUTH_TOKEN ?? ""),
          fromNumber: String(publicConfig.fromNumber ?? process.env.TWILIO_WHATSAPP_FROM ?? ""),
        }),
        providerKey: "twilio_whatsapp",
        publicConfig,
      };

    case "custom_http":
      return {
        provider: new CustomHttpWhatsAppProvider({
          baseUrl: String(publicConfig.baseUrl ?? process.env.CUSTOM_WHATSAPP_BASE_URL ?? ""),
          apiKey: String((secrets as any)?.apiKey ?? process.env.CUSTOM_WHATSAPP_API_KEY ?? ""),
          sender: String(publicConfig.sender ?? process.env.CUSTOM_WHATSAPP_SENDER ?? ""),
          extraHeadersJson: String(publicConfig.extraHeadersJson ?? process.env.CUSTOM_WHATSAPP_EXTRA_HEADERS_JSON ?? ""),
        }),
        providerKey: "custom_http",
        publicConfig,
      };

    default:
      throw new Error(`Unsupported WhatsApp provider: ${providerKey}`);
  }
}

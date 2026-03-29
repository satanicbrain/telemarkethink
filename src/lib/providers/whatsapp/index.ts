import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getChannelSettingSecrets } from "@/src/lib/settings/repository";
import { CustomHttpWhatsAppProvider } from "./custom-http";
import { MetaCloudProvider } from "./meta-cloud";
import { TwilioWhatsAppProvider } from "./twilio";
import { WhatsAppProvider, WhatsAppProviderKey } from "./types";

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
    .single();

  if (error || !data?.provider) {
    throw new Error("WhatsApp provider is not configured.");
  }

  const secrets = await getChannelSettingSecrets("whatsapp");
  const publicConfig = (data.public_config as Record<string, unknown>) ?? {};

  switch (data.provider as WhatsAppProviderKey) {
    case "meta_cloud_api":
      return {
        provider: new MetaCloudProvider({
          accessToken: String((secrets as any)?.accessToken ?? ""),
          phoneNumberId: String(publicConfig.phoneNumberId ?? ""),
          businessAccountId: String(publicConfig.businessAccountId ?? ""),
          webhookVerifyToken: String((secrets as any)?.webhookVerifyToken ?? ""),
          graphApiVersion: String(publicConfig.graphApiVersion ?? "v23.0"),
        }),
        providerKey: "meta_cloud_api",
        publicConfig,
      };

    case "twilio_whatsapp":
      return {
        provider: new TwilioWhatsAppProvider({
          accountSid: String(publicConfig.accountSid ?? ""),
          authToken: String((secrets as any)?.authToken ?? ""),
          fromNumber: String(publicConfig.fromNumber ?? ""),
        }),
        providerKey: "twilio_whatsapp",
        publicConfig,
      };

    case "custom_http":
      return {
        provider: new CustomHttpWhatsAppProvider({
          baseUrl: String(publicConfig.baseUrl ?? ""),
          apiKey: String((secrets as any)?.apiKey ?? ""),
          sender: String(publicConfig.sender ?? ""),
          extraHeadersJson: String(publicConfig.extraHeadersJson ?? ""),
        }),
        providerKey: "custom_http",
        publicConfig,
      };

    default:
      throw new Error(`Unsupported WhatsApp provider: ${data.provider}`);
  }
}

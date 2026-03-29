import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getChannelSettingSecrets } from "@/src/lib/settings/repository";
import { ResendProvider } from "./resend";

export async function getActiveEmailProvider() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("provider_settings")
    .select("provider, public_config")
    .eq("channel", "email")
    .single();

  const secrets = await getChannelSettingSecrets("email");
  const publicConfig = (data?.public_config as Record<string, unknown>) ?? {};

  return {
    provider: new ResendProvider({
      apiKey: String((secrets as any)?.apiKey ?? process.env.RESEND_API_KEY ?? ""),
      fromEmail: String(publicConfig.fromEmail ?? process.env.RESEND_FROM_EMAIL ?? ""),
    }),
    publicConfig,
  };
}

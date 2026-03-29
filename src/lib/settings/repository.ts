import { decryptJson, encryptJson } from "@/src/lib/security/crypto";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export type ChannelKey = "whatsapp" | "email";

type ProviderSettingsRow = {
  channel: ChannelKey;
  provider: string;
  public_config: Record<string, unknown> | null;
  secret_payload_encrypted: string | null;
  updated_by: string | null;
  updated_at: string;
};

function cleanSecrets(input?: Record<string, unknown>) {
  if (!input) return {};

  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    })
  );
}

function humanizeRepositoryError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("APP_ENCRYPTION_KEY")) {
      return "APP_ENCRYPTION_KEY belum diisi di Vercel Environment Variables. Isi minimal 32 karakter lalu redeploy.";
    }

    return error.message;
  }

  return "Terjadi kesalahan saat menyimpan provider settings.";
}

export async function getChannelSetting(channel: ChannelKey) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("provider_settings")
    .select("*")
    .eq("channel", channel)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return (data as ProviderSettingsRow | null) ?? null;
}

export async function getChannelSettingSecrets<T = Record<string, unknown>>(channel: ChannelKey) {
  const row = await getChannelSetting(channel);
  return decryptJson<T>(row?.secret_payload_encrypted);
}

export async function upsertChannelSetting(params: {
  channel: ChannelKey;
  provider: string;
  publicConfig: Record<string, unknown>;
  secretConfig?: Record<string, unknown>;
  updatedBy: string;
}) {
  try {
    const existingSecrets = (await getChannelSettingSecrets(params.channel)) ?? {};
    const mergedSecrets = {
      ...existingSecrets,
      ...cleanSecrets(params.secretConfig),
    };

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("provider_settings")
      .upsert(
        {
          channel: params.channel,
          provider: params.provider,
          public_config: params.publicConfig,
          secret_payload_encrypted: Object.keys(mergedSecrets).length
            ? encryptJson(mergedSecrets)
            : null,
          updated_by: params.updatedBy,
        },
        { onConflict: "channel" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return data as ProviderSettingsRow;
  } catch (error) {
    throw new Error(humanizeRepositoryError(error));
  }
}

export async function getMaskedSettings(channel: ChannelKey) {
  const row = await getChannelSetting(channel);
  const secrets = await getChannelSettingSecrets<Record<string, string>>(channel);

  return {
    channel,
    provider: row?.provider ?? null,
    publicConfig: row?.public_config ?? {},
    secretFieldsStored: Object.fromEntries(
      Object.keys(secrets ?? {}).map((key) => [key, Boolean(secrets?.[key])])
    ),
    updatedAt: row?.updated_at ?? null,
  };
}

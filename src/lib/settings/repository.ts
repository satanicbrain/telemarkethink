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

type PgLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function compactObject(input: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(input ?? {}).filter(([, value]) => value !== undefined)
  );
}

function isMissingColumnError(error: PgLikeError, columnName: string) {
  const haystack = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return haystack.includes(`column \"${columnName.toLowerCase()}\"`) || haystack.includes(columnName.toLowerCase());
}

export function toReadableErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const candidate = error as PgLikeError;

    if (candidate.message || candidate.details || candidate.hint) {
      const parts = [candidate.message, candidate.details, candidate.hint].filter(Boolean);
      return parts.join(" | ");
    }
  }

  return fallback;
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
  const existingSecrets = (await getChannelSettingSecrets(params.channel)) ?? {};
  const mergedSecrets = compactObject({
    ...existingSecrets,
    ...(params.secretConfig ?? {}),
  });

  const payloadBase = {
    channel: params.channel,
    provider: params.provider,
    public_config: compactObject(params.publicConfig),
    secret_payload_encrypted: Object.keys(mergedSecrets).length ? encryptJson(mergedSecrets) : null,
  };

  const admin = createSupabaseAdminClient();

  const firstAttempt = await admin
    .from("provider_settings")
    .upsert(
      {
        ...payloadBase,
        updated_by: params.updatedBy,
      },
      { onConflict: "channel" }
    )
    .select("*")
    .single();

  if (!firstAttempt.error) {
    return firstAttempt.data as ProviderSettingsRow;
  }

  if (!isMissingColumnError(firstAttempt.error, "updated_by")) {
    throw firstAttempt.error;
  }

  const fallbackAttempt = await admin
    .from("provider_settings")
    .upsert(payloadBase, { onConflict: "channel" })
    .select("*")
    .single();

  if (fallbackAttempt.error) {
    throw fallbackAttempt.error;
  }

  return fallbackAttempt.data as ProviderSettingsRow;
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

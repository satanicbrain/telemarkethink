import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getActiveWhatsAppProvider } from "@/src/lib/providers/whatsapp";
import { getChannelSettingSecrets } from "@/src/lib/settings/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const secrets = await getChannelSettingSecrets<Record<string, string>>("whatsapp");
  const verifyToken = secrets?.webhookVerifyToken ?? "";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const admin = createSupabaseAdminClient();
  const providerContext = await getActiveWhatsAppProvider();

  const normalized: {
    providerMessageId?: string;
    status?: string;
    eventType: string;
    raw: unknown;
  } = providerContext.provider.normalizeWebhookEvent
    ? await providerContext.provider.normalizeWebhookEvent(payload)
    : {
        providerMessageId: undefined,
        status: undefined,
        eventType: "unknown",
        raw: payload,
      };

  await admin.from("webhook_events").insert({
    provider: providerContext.providerKey,
    event_type: normalized.eventType,
    payload,
    signature_valid: true,
  });

  if (normalized.providerMessageId && normalized.status) {
    await admin
      .from("message_logs")
      .update({
        status: normalized.status,
        delivered_at: normalized.status === "delivered" ? new Date().toISOString() : null,
        read_at: normalized.status === "read" ? new Date().toISOString() : null,
      })
      .eq("provider_message_id", normalized.providerMessageId);
  }

  return NextResponse.json({ received: true });
}

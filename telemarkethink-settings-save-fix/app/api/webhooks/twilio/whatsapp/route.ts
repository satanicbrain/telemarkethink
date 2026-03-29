import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getChannelSettingSecrets } from "@/src/lib/settings/repository";
import twilio from "twilio";

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries()) as Record<string, string>;

  const secrets = await getChannelSettingSecrets<Record<string, string>>("whatsapp");
  const authToken = secrets?.authToken ?? "";

  let signatureValid = false;

  try {
    const signature = request.headers.get("x-twilio-signature") ?? "";
    const host = request.headers.get("x-forwarded-host") ?? new URL(request.url).host;
    const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
    const fullUrl = `${protocol}://${host}/api/webhooks/twilio/whatsapp`;

    signatureValid = twilio.validateRequest(authToken, signature, fullUrl, payload);
  } catch {
    signatureValid = false;
  }

  const admin = createSupabaseAdminClient();
  await admin.from("webhook_events").insert({
    provider: "twilio_whatsapp",
    event_type: payload.Body ? "inbound_message" : "status",
    payload,
    signature_valid: signatureValid,
  });

  if (payload.MessageSid && (payload.MessageStatus || payload.SmsStatus)) {
    await admin.from("message_logs").update({
      status: String(payload.MessageStatus || payload.SmsStatus),
    }).eq("provider_message_id", String(payload.MessageSid));
  }

  return NextResponse.json({ received: true, signatureValid });
}

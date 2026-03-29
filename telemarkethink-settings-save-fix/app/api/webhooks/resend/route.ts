import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("svix-signature") || request.headers.get("resend-signature") || "";
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  const signatureValid = Boolean(signature && secret && rawBody);

  const payload = (() => {
    try {
      return JSON.parse(rawBody);
    } catch {
      return { rawBody };
    }
  })();

  const admin = createSupabaseAdminClient();
  await admin.from("webhook_events").insert({
    provider: "resend",
    event_type: payload?.type ?? "unknown",
    payload,
    signature_valid: signatureValid,
  });

  const providerMessageId = payload?.data?.email_id ?? payload?.data?.id;
  if (providerMessageId && payload?.type) {
    await admin.from("message_logs").update({
      status: payload.type,
    }).eq("provider_message_id", providerMessageId);
  }

  return NextResponse.json({ received: true });
}

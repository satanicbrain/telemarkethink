import { getActiveEmailProvider } from "@/src/lib/providers/email";
import { getActiveWhatsAppProvider } from "@/src/lib/providers/whatsapp";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { renderTemplate } from "@/src/lib/templates/render";

export async function processQueue(limit = 20) {
  const admin = createSupabaseAdminClient();
  const { data: jobs } = await admin
    .from("message_queue")
    .select("*, contacts(*), automations(*)")
    .in("status", ["queued", "failed"])
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(limit);

  if (!jobs?.length) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const waContext = await getActiveWhatsAppProvider().catch(() => null);
  const emailContext = await getActiveEmailProvider().catch(() => null);

  for (const job of jobs) {
    await admin.from("message_queue").update({
      status: "processing",
      attempts: (job.attempts ?? 0) + 1,
    }).eq("id", job.id);

    const contact = job.contacts ?? null;

    try {
      if (job.channel === "whatsapp") {
        if (!waContext) throw new Error("No active WhatsApp provider configured.");

        const message = renderTemplate(
          "Halo {{name}}, saya follow up kembali untuk kebutuhan proteksi Anda.",
          { name: contact?.full_name ?? "" }
        );

        const result = await waContext.provider.sendText({
          to: contact?.phone_e164 ?? job.payload?.to ?? "",
          message,
          meta: { queueId: job.id },
        });

        if (!result.ok) throw new Error(result.error ?? "WhatsApp send failed");

        await admin.from("message_queue").update({
          status: "sent",
          provider: waContext.providerKey,
          provider_message_id: result.providerMessageId,
        }).eq("id", job.id);

        await admin.from("message_logs").insert({
          queue_id: job.id,
          contact_id: contact?.id ?? null,
          channel: "whatsapp",
          provider: waContext.providerKey,
          provider_message_id: result.providerMessageId,
          status: "sent",
          body_preview: message,
          provider_response: result.raw ?? {},
          sent_at: new Date().toISOString(),
        });

        sent += 1;
      }

      if (job.channel === "email") {
        if (!emailContext) throw new Error("No active email provider configured.");

        const subject = `Halo ${contact?.full_name ?? ""}, follow up kebutuhan proteksi Anda`;
        const html = `<p>Halo ${contact?.full_name ?? ""},</p><p>Kami follow up kembali untuk kebutuhan proteksi Anda.</p>`;

        const result = await emailContext.provider.send({
          to: contact?.email ?? job.payload?.to ?? "",
          subject,
          html,
        });

        if (!result.ok) throw new Error(result.error ?? "Email send failed");

        await admin.from("message_queue").update({
          status: "sent",
          provider: "resend",
          provider_message_id: result.providerMessageId,
        }).eq("id", job.id);

        await admin.from("message_logs").insert({
          queue_id: job.id,
          contact_id: contact?.id ?? null,
          channel: "email",
          provider: "resend",
          provider_message_id: result.providerMessageId,
          status: "sent",
          subject,
          body_preview: "Follow up email terkirim",
          provider_response: result.raw ?? {},
          sent_at: new Date().toISOString(),
        });

        sent += 1;
      }
    } catch (error) {
      failed += 1;
      await admin.from("message_queue").update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown queue processing error",
      }).eq("id", job.id);
    }
  }

  return { processed: jobs.length, sent, failed };
}

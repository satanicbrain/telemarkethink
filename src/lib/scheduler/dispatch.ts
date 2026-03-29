import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export async function dispatchAutomations() {
  const admin = createSupabaseAdminClient();
  const [{ data: automations }, { data: contacts }] = await Promise.all([
    admin.from("automations").select("*").eq("is_active", true),
    admin.from("contacts").select("*")
  ]);

  if (!automations?.length || !contacts?.length) {
    return { queued: 0 };
  }

  let queued = 0;

  for (const automation of automations) {
    if (automation.trigger_type === "birthday") {
      const now = new Date();
      const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      for (const contact of contacts) {
        if (!contact.birth_date) continue;
        const birth = new Date(contact.birth_date);
        const candidate = `${String(birth.getMonth() + 1).padStart(2, "0")}-${String(birth.getDate()).padStart(2, "0")}`;
        const consentOk = automation.channel === "whatsapp" ? contact.consent_whatsapp : contact.consent_email;
        const optOut = automation.channel === "whatsapp" ? contact.opt_out_whatsapp : contact.opt_out_email;

        if (candidate === today && consentOk && !optOut) {
          await admin.from("message_queue").insert({
            contact_id: contact.id,
            automation_id: automation.id,
            channel: automation.channel,
            provider: automation.channel === "whatsapp" ? "runtime" : "resend",
            run_at: new Date().toISOString(),
            payload: { reason: "birthday" },
          });
          queued += 1;
        }
      }
    }

    if (automation.trigger_type === "follow_up") {
      const delayDays = Number(automation.delay_days ?? 7);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - delayDays);

      for (const contact of contacts) {
        const consentOk = automation.channel === "whatsapp" ? contact.consent_whatsapp : contact.consent_email;
        const optOut = automation.channel === "whatsapp" ? contact.opt_out_whatsapp : contact.opt_out_email;

        if (!consentOk || optOut) continue;

        if (!contact.last_contacted_at || new Date(contact.last_contacted_at) <= cutoff) {
          await admin.from("message_queue").insert({
            contact_id: contact.id,
            automation_id: automation.id,
            channel: automation.channel,
            provider: automation.channel === "whatsapp" ? "runtime" : "resend",
            run_at: new Date().toISOString(),
            payload: { reason: "follow_up" },
          });
          queued += 1;
        }
      }
    }
  }

  return { queued };
}

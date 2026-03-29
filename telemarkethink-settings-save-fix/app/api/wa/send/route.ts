import { NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth";
import { getActiveWhatsAppProvider } from "@/src/lib/providers/whatsapp";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { renderTemplate } from "@/src/lib/templates/render";
import { sendWhatsAppSchema } from "@/src/lib/validations/send";

type JsonRecord = Record<string, unknown>;

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json();
  const parsed = sendWhatsAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const providerContext = await getActiveWhatsAppProvider();

  const contact = parsed.data.contactId
    ? (await admin.from("contacts").select("*").eq("id", parsed.data.contactId).single()).data
    : null;

  const student = parsed.data.studentId
    ? (await admin.from("telemarket_students").select("*").eq("id", parsed.data.studentId).single()).data
    : null;

  const template = parsed.data.templateId
    ? (await admin.from("wa_templates").select("*").eq("id", parsed.data.templateId).single()).data
    : null;

  const recipientName = student?.parent ?? student?.student_name ?? contact?.full_name ?? "";
  const recipientPhone = parsed.data.to ?? student?.telephone ?? contact?.phone_e164;

  if (!recipientPhone) {
    return NextResponse.json({ error: "Target WhatsApp is required." }, { status: 400 });
  }

  const variables = {
    name: recipientName,
    full_name: recipientName,
    student_name: student?.student_name ?? contact?.full_name ?? "",
    nick_name: student?.nick_name ?? "",
    parent: student?.parent ?? "",
    birthday: student?.birthday ?? "",
    gender: student?.gender ?? "",
    address: student?.address ?? "",
    telephone: student?.telephone ?? contact?.phone_e164 ?? recipientPhone,
    email: student?.email ?? contact?.email ?? "",
    birthday_date: student?.birthday_date ?? "",
    city: contact?.city ?? "",
    product_interest: contact?.product_interest ?? "",
  };

  const message = template
    ? renderTemplate(template.body_template, variables)
    : parsed.data.message;

  if (!message && !(template?.provider_template_key && providerContext.provider.sendTemplate)) {
    return NextResponse.json({ error: "Message or template is required." }, { status: 400 });
  }

  const result =
    template?.provider_template_key && providerContext.provider.sendTemplate
      ? await providerContext.provider.sendTemplate({
          to: recipientPhone,
          templateName: template.provider_template_key,
          languageCode: template.language_code ?? "id",
          variables: [],
          meta: { requestedBy: auth.user.id, studentId: student?.id ?? null },
        })
      : await providerContext.provider.sendText({
          to: recipientPhone,
          message: message ?? "",
          meta: { requestedBy: auth.user.id, studentId: student?.id ?? null },
        });

  const providerResponse = {
    ...asObject(result.raw),
    recipient_meta: {
      student_id: student?.id ?? null,
      student_name: student?.student_name ?? null,
      parent: student?.parent ?? null,
      phone: recipientPhone,
      email: student?.email ?? contact?.email ?? null,
    },
  };

  await admin.from("message_logs").insert({
    contact_id: contact?.id ?? null,
    channel: "whatsapp",
    provider: providerContext.providerKey,
    provider_message_id: result.providerMessageId ?? null,
    status: result.ok ? "sent" : "failed",
    body_preview: message ?? template?.name ?? "",
    provider_response: providerResponse,
    error_message: result.error ?? null,
    sent_at: result.ok ? new Date().toISOString() : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "WhatsApp send failed", raw: result.raw }, { status: 500 });
  }

  return NextResponse.json({ data: result, recipientMeta: providerResponse.recipient_meta });
}

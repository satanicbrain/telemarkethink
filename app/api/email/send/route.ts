import { NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth";
import { getActiveEmailProvider } from "@/src/lib/providers/email";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { renderTemplate } from "@/src/lib/templates/render";
import { sendEmailSchema } from "@/src/lib/validations/send";

type JsonRecord = Record<string, unknown>;

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json();
  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { provider } = await getActiveEmailProvider();

  const contact = parsed.data.contactId
    ? (await admin.from("contacts").select("*").eq("id", parsed.data.contactId).single()).data
    : null;

  const student = parsed.data.studentId
    ? (await admin.from("telemarket_students").select("*").eq("id", parsed.data.studentId).single()).data
    : null;

  const template = parsed.data.templateId
    ? (await admin.from("email_templates").select("*").eq("id", parsed.data.templateId).single()).data
    : null;

  const recipientName = student?.parent ?? student?.student_name ?? contact?.full_name ?? "";
  const to = parsed.data.to ?? student?.email ?? contact?.email;
  if (!to) {
    return NextResponse.json({ error: "Target email is required." }, { status: 400 });
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
    telephone: student?.telephone ?? contact?.phone_e164 ?? "",
    email: student?.email ?? contact?.email ?? to,
    birthday_date: student?.birthday_date ?? "",
    city: contact?.city ?? "",
    product_interest: contact?.product_interest ?? "",
  };

  const subject = template
    ? renderTemplate(template.subject_template, variables)
    : parsed.data.subject;

  const html = template
    ? renderTemplate(template.html_template, variables)
    : parsed.data.html;

  if (!subject || !html) {
    return NextResponse.json({ error: "Subject and html are required." }, { status: 400 });
  }

  const result = await provider.send({ to, subject, html });

  const providerResponse = {
    ...asObject(result.raw),
    recipient_meta: {
      student_id: student?.id ?? null,
      student_name: student?.student_name ?? null,
      parent: student?.parent ?? null,
      phone: student?.telephone ?? contact?.phone_e164 ?? null,
      email: to,
    },
  };

  await admin.from("message_logs").insert({
    contact_id: contact?.id ?? null,
    channel: "email",
    provider: "resend",
    provider_message_id: result.providerMessageId ?? null,
    status: result.ok ? "sent" : "failed",
    subject,
    body_preview: html.replace(/<[^>]+>/g, " ").slice(0, 500),
    provider_response: providerResponse,
    error_message: result.error ?? null,
    sent_at: result.ok ? new Date().toISOString() : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Email send failed", raw: result.raw }, { status: 500 });
  }

  return NextResponse.json({ data: result, recipientMeta: providerResponse.recipient_meta });
}

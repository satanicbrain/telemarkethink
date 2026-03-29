import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  bodyTemplate: z.string().min(2),
  providerTemplateKey: z.string().optional().default(""),
  languageCode: z.string().optional().default("id"),
});

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("wa_templates").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("wa_templates")
    .insert({
      name: parsed.data.name,
      body_template: parsed.data.bodyTemplate,
      provider_template_key: parsed.data.providerTemplateKey || null,
      language_code: parsed.data.languageCode || "id",
      variables: [],
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

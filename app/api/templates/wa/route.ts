import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { extractTemplateVariables } from "@/src/lib/templates/render";
import { recommendedWaTemplatePresets, toWaTemplateRecord } from "@/src/lib/templates/wa-presets";

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Nama template minimal 2 karakter."),
  category: z.string().trim().max(100).optional().nullable(),
  bodyTemplate: z.string().trim().min(10, "Isi template minimal 10 karakter."),
  providerTemplateKey: z.string().trim().optional().nullable(),
  languageCode: z.string().trim().min(2).max(10).optional().default("id"),
  isActive: z.boolean().optional().default(true),
});

function parseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function GET() {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("wa_templates")
    .select("id, name, category, body_template, provider_template_key, language_code, variables, is_active, created_at, updated_at")
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const admin = createSupabaseAdminClient();

  try {
    const body = await request.json().catch(() => null);

    if (body?.action === "seed_defaults") {
      const payload = recommendedWaTemplatePresets.map(toWaTemplateRecord);
      const { data, error } = await admin
        .from("wa_templates")
        .upsert(payload, { onConflict: "name" })
        .select("id, name");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        data,
        inserted: payload.length,
        message: `${payload.length} template rekomendasi berhasil ditambahkan atau diperbarui.`,
      });
    }

    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
    }

    const payload = {
      name: parsed.data.name,
      category: parsed.data.category?.trim() || null,
      body_template: parsed.data.bodyTemplate,
      provider_template_key: parsed.data.providerTemplateKey?.trim() || null,
      language_code: parsed.data.languageCode || "id",
      variables: extractTemplateVariables(parsed.data.bodyTemplate),
      is_active: parsed.data.isActive ?? true,
    };

    const { data, error } = await admin.from("wa_templates").insert(payload).select("*").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Template WhatsApp berhasil dibuat." });
  } catch (error) {
    return NextResponse.json({ error: parseErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const body = await request.json().catch(() => null);
    const parsed = templateSchema.extend({ id: z.string().uuid("ID template tidak valid.") }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const payload = {
      name: parsed.data.name,
      category: parsed.data.category?.trim() || null,
      body_template: parsed.data.bodyTemplate,
      provider_template_key: parsed.data.providerTemplateKey?.trim() || null,
      language_code: parsed.data.languageCode || "id",
      variables: extractTemplateVariables(parsed.data.bodyTemplate),
      is_active: parsed.data.isActive ?? true,
    };

    const { data, error } = await admin
      .from("wa_templates")
      .update(payload)
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Template WhatsApp berhasil diperbarui." });
  } catch (error) {
    return NextResponse.json({ error: parseErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID template wajib diisi." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("wa_templates").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Template WhatsApp berhasil dihapus." });
}

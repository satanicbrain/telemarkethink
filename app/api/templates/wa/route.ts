import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { extractTemplateVariables } from "@/src/lib/templates/render";
import { recommendedWaTemplatePresets, toWaTemplateRecord } from "@/src/lib/templates/wa-presets";

type DbTemplateRow = {
  id: string;
  name: string;
  category: string | null;
  body_template: string;
  provider_template_key?: string | null;
  meta_template_name?: string | null;
  language_code: string | null;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

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
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
    if (typeof maybeError.details === "string" && maybeError.details.trim()) {
      return maybeError.details;
    }
    if (typeof maybeError.hint === "string" && maybeError.hint.trim()) {
      return maybeError.hint;
    }
    if (typeof maybeError.code === "string" && maybeError.code.trim()) {
      return `Database error: ${maybeError.code}`;
    }
  }
  return "Terjadi kesalahan pada server.";
}

function isMissingColumnError(error: unknown, columnName: string) {
  const message = parseErrorMessage(error).toLowerCase();
  return message.includes(columnName.toLowerCase()) && (
    message.includes("column") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function normalizeTemplateRow(row: DbTemplateRow) {
  return {
    ...row,
    provider_template_key: row.provider_template_key ?? row.meta_template_name ?? null,
  };
}

async function selectTemplates() {
  const admin = createSupabaseAdminClient();

  const modern = await admin
    .from("wa_templates")
    .select("id, name, category, body_template, provider_template_key, language_code, variables, is_active, created_at, updated_at")
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  if (!modern.error) {
    return {
      data: ((modern.data ?? []) as DbTemplateRow[]).map(normalizeTemplateRow),
      error: null as string | null,
    };
  }

  if (!isMissingColumnError(modern.error, "provider_template_key")) {
    return { data: [] as ReturnType<typeof normalizeTemplateRow>[], error: parseErrorMessage(modern.error) };
  }

  const legacy = await admin
    .from("wa_templates")
    .select("id, name, category, body_template, meta_template_name, language_code, variables, is_active, created_at, updated_at")
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  if (legacy.error) {
    return { data: [] as ReturnType<typeof normalizeTemplateRow>[], error: parseErrorMessage(legacy.error) };
  }

  return {
    data: ((legacy.data ?? []) as DbTemplateRow[]).map(normalizeTemplateRow),
    error: null as string | null,
  };
}

async function insertTemplate(input: z.infer<typeof templateSchema>) {
  const admin = createSupabaseAdminClient();
  const variables = extractTemplateVariables(input.bodyTemplate);
  const modernPayload = {
    name: input.name,
    provider: "meta_cloud_api",
    category: input.category?.trim() || null,
    body_template: input.bodyTemplate,
    provider_template_key: input.providerTemplateKey?.trim() || null,
    language_code: input.languageCode || "id",
    variables,
    is_active: input.isActive ?? true,
  };

  const modernInsert = await admin.from("wa_templates").insert(modernPayload).select("*").single();
  if (!modernInsert.error) {
    return { data: normalizeTemplateRow(modernInsert.data as DbTemplateRow), error: null as string | null };
  }

  if (!isMissingColumnError(modernInsert.error, "provider_template_key")) {
    return { data: null, error: parseErrorMessage(modernInsert.error) };
  }

  const legacyPayload = {
    name: input.name,
    provider: "meta_cloud_api",
    category: input.category?.trim() || null,
    body_template: input.bodyTemplate,
    meta_template_name: input.providerTemplateKey?.trim() || null,
    language_code: input.languageCode || "id",
    variables,
    is_active: input.isActive ?? true,
  };

  const legacyInsert = await admin.from("wa_templates").insert(legacyPayload).select("*").single();
  if (legacyInsert.error) {
    return { data: null, error: parseErrorMessage(legacyInsert.error) };
  }

  return { data: normalizeTemplateRow(legacyInsert.data as DbTemplateRow), error: null as string | null };
}

async function updateTemplate(input: z.infer<typeof templateSchema> & { id: string }) {
  const admin = createSupabaseAdminClient();
  const variables = extractTemplateVariables(input.bodyTemplate);
  const modernPayload = {
    name: input.name,
    provider: "meta_cloud_api",
    category: input.category?.trim() || null,
    body_template: input.bodyTemplate,
    provider_template_key: input.providerTemplateKey?.trim() || null,
    language_code: input.languageCode || "id",
    variables,
    is_active: input.isActive ?? true,
  };

  const modernUpdate = await admin
    .from("wa_templates")
    .update(modernPayload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (!modernUpdate.error) {
    return { data: normalizeTemplateRow(modernUpdate.data as DbTemplateRow), error: null as string | null };
  }

  if (!isMissingColumnError(modernUpdate.error, "provider_template_key")) {
    return { data: null, error: parseErrorMessage(modernUpdate.error) };
  }

  const legacyPayload = {
    name: input.name,
    provider: "meta_cloud_api",
    category: input.category?.trim() || null,
    body_template: input.bodyTemplate,
    meta_template_name: input.providerTemplateKey?.trim() || null,
    language_code: input.languageCode || "id",
    variables,
    is_active: input.isActive ?? true,
  };

  const legacyUpdate = await admin
    .from("wa_templates")
    .update(legacyPayload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (legacyUpdate.error) {
    return { data: null, error: parseErrorMessage(legacyUpdate.error) };
  }

  return { data: normalizeTemplateRow(legacyUpdate.data as DbTemplateRow), error: null as string | null };
}

export async function GET() {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const result = await selectTemplates();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const admin = createSupabaseAdminClient();

  try {
    const body = await request.json().catch(() => null);

    if (body?.action === "seed_defaults") {
      const payload = recommendedWaTemplatePresets.map((preset) => ({
        ...toWaTemplateRecord(preset),
        provider: "meta_cloud_api",
      }));

      const modernSeed = await admin
        .from("wa_templates")
        .upsert(payload, { onConflict: "name" })
        .select("id, name");

      if (modernSeed.error && !isMissingColumnError(modernSeed.error, "provider_template_key")) {
        return NextResponse.json({ error: parseErrorMessage(modernSeed.error) }, { status: 500 });
      }

      if (modernSeed.error) {
        const legacyPayload = payload.map(({ provider_template_key, ...row }) => ({
          ...row,
          meta_template_name: provider_template_key,
        }));
        const legacySeed = await admin
          .from("wa_templates")
          .upsert(legacyPayload, { onConflict: "name" })
          .select("id, name");

        if (legacySeed.error) {
          return NextResponse.json({ error: parseErrorMessage(legacySeed.error) }, { status: 500 });
        }
      }

      return NextResponse.json({
        inserted: payload.length,
        message: `${payload.length} template rekomendasi berhasil ditambahkan atau diperbarui.`,
      });
    }

    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
    }

    const result = await insertTemplate(parsed.data);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ data: result.data, message: "Template WhatsApp berhasil dibuat." });
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

    const result = await updateTemplate(parsed.data);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ data: result.data, message: "Template WhatsApp berhasil diperbarui." });
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

  if (error) return NextResponse.json({ error: parseErrorMessage(error) }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Template WhatsApp berhasil dihapus." });
}

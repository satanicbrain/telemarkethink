import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const createStudentSchema = z.object({
  no: z.string().trim().optional().nullable(),
  student_name: z.string().trim().min(1, "Nama siswa wajib diisi."),
  nick_name: z.string().trim().optional().nullable(),
  parent: z.string().trim().optional().nullable(),
  birthday: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  telephone: z.string().trim().min(6, "Nomor telepon terlalu pendek."),
  email: z.union([z.string().trim().email("Email tidak valid."), z.literal(""), z.null()]).optional(),
  birthday_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"), z.literal(""), z.null()]).optional(),
  whatsapp_opt_in: z.boolean().default(false),
  email_opt_in: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: z.string().trim().optional().nullable(),
  tags: z.array(z.string().trim()).optional().default([]),
});

function normalizeNullable(value: string | null | undefined) {
  if (value == null) return null;
  const cleaned = value.trim();
  return cleaned.length ? cleaned : null;
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json();
  const parsed = createStudentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
  }

  const payload = parsed.data;
  const admin = createSupabaseAdminClient();

  const insertPayload = {
    no: normalizeNullable(payload.no),
    student_name: payload.student_name.trim(),
    nick_name: normalizeNullable(payload.nick_name),
    parent: normalizeNullable(payload.parent),
    birthday: normalizeNullable(payload.birthday),
    gender: normalizeNullable(payload.gender),
    address: normalizeNullable(payload.address),
    telephone: payload.telephone.trim(),
    email: normalizeNullable(payload.email ?? null),
    birthday_date: normalizeNullable(payload.birthday_date ?? null),
    whatsapp_opt_in: payload.whatsapp_opt_in,
    email_opt_in: payload.email_opt_in,
    is_active: payload.is_active,
    notes: normalizeNullable(payload.notes),
    tags: (payload.tags ?? []).map((item) => item.trim()).filter(Boolean),
  };

  const { data, error } = await admin
    .from("telemarket_students")
    .insert(insertPayload)
    .select("id, no, student_name, nick_name, parent, birthday, gender, address, telephone, email, created_at, birthday_date, whatsapp_opt_in, email_opt_in, is_active, notes, tags")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

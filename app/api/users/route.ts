import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const updateSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "operator"]),
});

const createSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120, "Nama terlalu panjang."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  role: z.enum(["admin", "operator"]),
});

async function canManageUsers(role: "admin" | "operator") {
  if (role === "admin") return true;
  const admin = createSupabaseAdminClient();
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return (count ?? 0) === 0;
}

export async function GET() {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const allowed = await canManageUsers(auth.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const users = authData.users ?? [];
  const userIds = users.map((user) => user.id);

  const { data: profiles, error: profilesError } = userIds.length
    ? await admin.from("profiles").select("id, full_name, role").in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const data = users
    .map((user) => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        email: user.email ?? null,
        fullName: profile?.full_name ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
        role: profile?.role ?? "operator",
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => (a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const allowed = await canManageUsers(auth.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const payload = parsed.data;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.fullName,
    },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Gagal membuat user." }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: created.user.id,
      full_name: payload.fullName,
      role: payload.role,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: created.user.id,
      email: created.user.email ?? payload.email,
      fullName: payload.fullName,
      role: payload.role,
      createdAt: created.user.created_at ?? new Date().toISOString(),
      lastSignInAt: created.user.last_sign_in_at ?? null,
    },
  });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const allowed = await canManageUsers(auth.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: userResult, error: getUserError } = await admin.auth.admin.getUserById(parsed.data.userId);
  if (getUserError || !userResult.user) {
    return NextResponse.json({ error: getUserError?.message ?? "User tidak ditemukan." }, { status: 404 });
  }

  const fullName = typeof userResult.user.user_metadata?.full_name === "string"
    ? userResult.user.user_metadata.full_name
    : typeof userResult.user.user_metadata?.name === "string"
      ? userResult.user.user_metadata.name
      : null;

  const { error } = await admin.from("profiles").upsert(
    {
      id: parsed.data.userId,
      full_name: fullName,
      role: parsed.data.role,
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

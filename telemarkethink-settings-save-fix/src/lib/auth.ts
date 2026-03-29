import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type AppRole = "admin" | "operator";

export type AuthedUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AppRole;
};

export async function getCurrentUser(): Promise<AuthedUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createSupabaseAdminClient();
  let { data: profile } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fallbackName = typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

    await admin.from("profiles").upsert(
      { id: user.id, full_name: fallbackName, role: "operator" },
      { onConflict: "id" }
    );

    const refreshed = await admin
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    profile = refreshed.data ?? { full_name: fallbackName, role: "operator" };
  }

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role ?? "operator") as AppRole,
  };
}

export async function requirePageUser(allowedRoles: AppRole[] = ["admin", "operator"]) {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    redirect("/login");
  }

  return user;
}

export async function requireApiUser(allowedRoles: AppRole[] = ["admin", "operator"]) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  if (!allowedRoles.includes(user.role)) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return { ok: true as const, user };
}

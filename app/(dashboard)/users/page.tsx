import { requirePageUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { UserManagement } from "@/src/components/users/user-management";

export default async function UsersPage() {
  const user = await requirePageUser(["admin", "operator"]);
  const admin = createSupabaseAdminClient();
  const { count: adminCount } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  const bootstrapMode = (adminCount ?? 0) === 0;
  const canManageUsers = user.role === "admin" || bootstrapMode;

  return (
    <UserManagement
      currentUserId={user.id}
      currentUserRole={user.role}
      currentUserEmail={user.email}
      currentUserName={user.fullName}
      canManageUsers={canManageUsers}
      bootstrapMode={bootstrapMode}
    />
  );
}

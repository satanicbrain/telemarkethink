import { requirePageUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { DashboardShell } from "@/src/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const admin = createSupabaseAdminClient();
  const { count: adminCount } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  const bootstrapMode = (adminCount ?? 0) === 0;

  return (
    <DashboardShell role={user.role} email={user.email} fullName={user.fullName} bootstrapMode={bootstrapMode}>
      {children}
    </DashboardShell>
  );
}

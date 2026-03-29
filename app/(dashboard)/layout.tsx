import { requirePageUser } from "@/src/lib/auth";
import { DashboardShell } from "@/src/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();

  return (
    <DashboardShell role={user.role} email={user.email} fullName={user.fullName}>
      {children}
    </DashboardShell>
  );
}

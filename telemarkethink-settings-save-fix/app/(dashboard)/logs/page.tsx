import { Topbar } from "@/src/components/layout/topbar";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { requirePageUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export default async function LogsPage() {
  await requirePageUser();
  const admin = createSupabaseAdminClient();

  const { data: logs } = await admin
    .from("message_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <Topbar title="Delivery Logs" subtitle="Pantau status kirim dan kegagalan pengiriman." />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">50 log terakhir</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(logs ?? []).length ? (
              logs?.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{log.channel.toUpperCase()}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {log.status}
                    </span>
                    <span className="text-xs text-slate-500">{log.provider}</span>
                  </div>
                  {log.subject ? <div className="mt-2 text-sm font-medium text-slate-700">{log.subject}</div> : null}
                  <div className="mt-2 text-sm text-slate-600">{log.body_preview ?? "-"}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">Belum ada log pengiriman.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

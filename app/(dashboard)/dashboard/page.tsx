import { Topbar } from "@/src/components/layout/topbar";
import { StatCard } from "@/src/components/layout/stat-card";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { requirePageUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getMaskedSettings } from "@/src/lib/settings/repository";

export default async function DashboardPage() {
  await requirePageUser();
  const admin = createSupabaseAdminClient();

  const [
    { count: contactsCount },
    { count: waConsentCount },
    { count: emailConsentCount },
    { count: queueCount },
    { data: logs },
    whatsappSettings,
  ] = await Promise.all([
    admin.from("contacts").select("*", { count: "exact", head: true }),
    admin.from("contacts").select("*", { count: "exact", head: true }).eq("consent_whatsapp", true),
    admin.from("contacts").select("*", { count: "exact", head: true }).eq("consent_email", true),
    admin.from("message_queue").select("*", { count: "exact", head: true }).eq("status", "queued"),
    admin.from("message_logs").select("*").order("created_at", { ascending: false }).limit(8),
    getMaskedSettings("whatsapp"),
  ]);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Pantau kontak, queue, provider aktif, dan aktivitas pengiriman terbaru."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total kontak" value={contactsCount ?? 0} />
        <StatCard label="Consent WhatsApp" value={waConsentCount ?? 0} />
        <StatCard label="Consent Email" value={emailConsentCount ?? 0} />
        <StatCard label="Queue aktif" value={queueCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Log pengiriman terbaru</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(logs ?? []).length ? (
                logs?.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {log.channel.toUpperCase()}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {log.status}
                      </span>
                      <span className="text-xs text-slate-500">{log.provider}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{log.body_preview ?? "-"}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  Belum ada log pengiriman.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Provider aktif</h2>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">WhatsApp</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {whatsappSettings.provider ?? "Belum diset"}
              </div>
              <div className="mt-3 text-sm text-slate-600">
                Ganti provider langsung di menu settings. Credential lama tidak ditampilkan penuh kembali ke browser.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

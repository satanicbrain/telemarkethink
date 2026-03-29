import Link from "next/link";
import { Topbar } from "@/src/components/layout/topbar";
import { StatCard } from "@/src/components/layout/stat-card";
import { StudentsTable } from "@/src/components/contacts/students-table";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { requirePageUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const PAGE_SIZE = 10;

type StudentRow = {
  id: string;
  student_name: string;
  nick_name: string | null;
  parent: string | null;
  birthday: string | null;
  gender: string | null;
  address: string | null;
  telephone: string;
  email: string | null;
  created_at: string;
  birthday_date: string | null;
  whatsapp_opt_in: boolean;
  email_opt_in: boolean;
};

type WaTemplate = {
  id: string;
  name: string;
  body_template: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject_template: string;
  html_template: string;
};

type MessageHistory = {
  id: string;
  channel: "whatsapp" | "email";
  provider: string;
  status: string;
  subject: string | null;
  body_preview: string | null;
  provider_response: Record<string, unknown> | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

function parseDateOnly(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function getJakartaTodayParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? 0),
    month: Number(parts.find((part) => part.type === "month")?.value ?? 0),
    day: Number(parts.find((part) => part.type === "day")?.value ?? 0),
  };
}

function calculateAge(birthdayDate: string | null) {
  const birth = parseDateOnly(birthdayDate);
  if (!birth) return null;

  const today = getJakartaTodayParts();
  let age = today.year - birth.year;

  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function buildStudentsQuery(admin: ReturnType<typeof createSupabaseAdminClient>, q: string) {
  let query = admin
    .from("telemarket_students")
    .select(
      "id, student_name, nick_name, parent, birthday, gender, address, telephone, email, created_at, birthday_date, whatsapp_opt_in, email_opt_in",
      { count: "exact" }
    );

  if (q) {
    const escaped = q.replace(/,/g, " ").trim();
    query = query.or([
      `student_name.ilike.%${escaped}%`,
      `nick_name.ilike.%${escaped}%`,
      `parent.ilike.%${escaped}%`,
      `telephone.ilike.%${escaped}%`,
      `email.ilike.%${escaped}%`,
      `address.ilike.%${escaped}%`,
    ].join(","));
  }

  return query;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requirePageUser();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const admin = createSupabaseAdminClient();

  const query = buildStudentsQuery(admin, q)
    .order("created_at", { ascending: false })
    .range(from, to);

  const [
    { data: students, count },
    { count: totalWhatsAppOptIn },
    { count: totalEmailOptIn },
    { data: birthdayRows },
    { data: waTemplates },
    { data: emailTemplates },
    { data: recentLogs },
  ] = await Promise.all([
    query,
    admin.from("telemarket_students").select("id", { count: "exact", head: true }).eq("whatsapp_opt_in", true),
    admin.from("telemarket_students").select("id", { count: "exact", head: true }).eq("email_opt_in", true),
    admin.from("telemarket_students").select("birthday_date").not("birthday_date", "is", null),
    admin.from("wa_templates").select("id, name, body_template").eq("is_active", true).order("created_at", { ascending: false }).limit(6),
    admin.from("email_templates").select("id, name, subject_template, html_template").eq("is_active", true).order("created_at", { ascending: false }).limit(6),
    admin.from("message_logs").select("id, channel, provider, status, subject, body_preview, provider_response, error_message, sent_at, created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  const rows = ((students ?? []) as StudentRow[]).map((student) => ({
    ...student,
    age: calculateAge(student.birthday_date),
  }));

  const nowMonth = getJakartaTodayParts().month;
  const birthdaysThisMonth = (birthdayRows ?? []).filter((row) => {
    const parsed = parseDateOnly(row.birthday_date);
    return parsed?.month === nowMonth;
  }).length;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const startEntry = count ? from + 1 : 0;
  const endEntry = Math.min(count ?? 0, from + rows.length);

  const paginationHref = (page: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    search.set("page", String(page));
    return `/contacts?${search.toString()}`;
  };

  return (
    <>
      <Topbar
        title="Kontak"
        subtitle="Data siswa dan orang tua untuk aksi komunikasi yang cepat, rapi, dan personal."
        right={
          <form className="flex w-full flex-col gap-2 sm:flex-row">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari student, parent, telepon, email, atau alamat"
              className="min-w-[260px] bg-white"
            />
            <Button type="submit">Cari</Button>
          </form>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total hasil" value={count ?? 0} hint={q ? `Pencarian untuk “${q}”` : "Semua data siswa aktif di database"} />
        <StatCard label="WA opt-in" value={totalWhatsAppOptIn ?? 0} hint="Siap dipakai untuk komunikasi WhatsApp" />
        <StatCard label="Email opt-in" value={totalEmailOptIn ?? 0} hint="Siap dipakai untuk email manual maupun otomatis" />
        <StatCard label="Ulang tahun bulan ini" value={birthdaysThisMonth} hint="Bagus untuk automation greeting yang personal" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Daftar siswa</h2>
            <p className="mt-1 text-sm text-slate-500">
              Menampilkan {startEntry}-{endEntry} dari {count ?? 0} data.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Default tampil 10 data per halaman. Gunakan pencarian untuk hasil yang lebih cepat.
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <StudentsTable
            rows={rows}
            waTemplates={(waTemplates ?? []) as WaTemplate[]}
            emailTemplates={(emailTemplates ?? []) as EmailTemplate[]}
            recentLogs={(recentLogs ?? []) as MessageHistory[]}
          />

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Belum ada data yang cocok. Coba kata kunci lain.
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={paginationHref(Math.max(1, currentPage - 1))}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition ${currentPage <= 1 ? "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                >
                  Sebelumnya
                </Link>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, index, filtered) => {
                    const prev = filtered[index - 1];
                    const showGap = prev && page - prev > 1;
                    return (
                      <div key={page} className="flex items-center gap-2">
                        {showGap ? <span className="px-1 text-slate-400">...</span> : null}
                        <Link
                          href={paginationHref(page)}
                          className={`inline-flex min-w-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition ${page === currentPage ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                        >
                          {page}
                        </Link>
                      </div>
                    );
                  })}
                <Link
                  href={paginationHref(Math.min(totalPages, currentPage + 1))}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition ${currentPage >= totalPages ? "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                >
                  Berikutnya
                </Link>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

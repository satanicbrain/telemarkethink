"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";

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
  age: number | null;
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

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      )}
    >
      {label}
    </span>
  );
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const parts = value.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return value;
  }

  return date.toLocaleDateString("id-ID", withTime
    ? {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    : {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function DetailItem({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</div>
          <div className="mt-1 break-words text-sm text-slate-700">{value || "-"}</div>
        </div>
        {action}
      </div>
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "TS";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function normalizePhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function renderInlineTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => variables[key] ?? "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function CopyButton({ value, label }: { value: string | null; label: string }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      className="shrink-0 px-3 py-2 text-xs"
      onClick={async (event) => {
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? `${label} disalin` : `Copy ${label}`}
    </Button>
  );
}

export function StudentsTable({
  rows,
  waTemplates,
  emailTemplates,
  recentLogs,
}: {
  rows: StudentRow[];
  waTemplates: WaTemplate[];
  emailTemplates: EmailTemplate[];
  recentLogs: MessageHistory[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [selectedRow, setSelectedRow] = useState<StudentRow | null>(null);
  const [selectedWaTemplateId, setSelectedWaTemplateId] = useState<string | null>(waTemplates[0]?.id ?? null);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<string | null>(emailTemplates[0]?.id ?? null);
  const [historyLogs, setHistoryLogs] = useState<MessageHistory[]>(recentLogs);

  const sortedRows = useMemo(() => rows, [rows]);

  useEffect(() => {
    if (!selectedRow) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRow(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedRow]);

  useEffect(() => {
    if (waTemplates.length && !selectedWaTemplateId) {
      setSelectedWaTemplateId(waTemplates[0].id);
    }
  }, [waTemplates, selectedWaTemplateId]);

  useEffect(() => {
    if (emailTemplates.length && !selectedEmailTemplateId) {
      setSelectedEmailTemplateId(emailTemplates[0].id);
    }
  }, [emailTemplates, selectedEmailTemplateId]);

  const selectedWaTemplate = useMemo(
    () => waTemplates.find((template) => template.id === selectedWaTemplateId) ?? waTemplates[0] ?? null,
    [waTemplates, selectedWaTemplateId]
  );
  const selectedEmailTemplate = useMemo(
    () => emailTemplates.find((template) => template.id === selectedEmailTemplateId) ?? emailTemplates[0] ?? null,
    [emailTemplates, selectedEmailTemplateId]
  );

  function getVariables(row: StudentRow) {
    return {
      name: row.parent || row.student_name,
      full_name: row.parent || row.student_name,
      student_name: row.student_name,
      nick_name: row.nick_name || "",
      parent: row.parent || "",
      birthday: row.birthday || (row.birthday_date ? formatDate(row.birthday_date) : ""),
      gender: row.gender || "",
      address: row.address || "",
      telephone: row.telephone,
      email: row.email || "",
      birthday_date: row.birthday_date || "",
      age: row.age !== null ? String(row.age) : "",
      product_interest: "",
      city: "",
    };
  }

  function appendLocalHistory(row: StudentRow, channel: "whatsapp" | "email", status: string, preview: { subject?: string | null; body: string; provider: string }) {
    const newLog: MessageHistory = {
      id: `${channel}-${row.id}-${Date.now()}`,
      channel,
      provider: preview.provider,
      status,
      subject: preview.subject ?? null,
      body_preview: preview.body,
      provider_response: {
        recipient_meta: {
          student_id: row.id,
          student_name: row.student_name,
          parent: row.parent,
          phone: row.telephone,
          email: row.email,
        },
      },
      error_message: status === "failed" ? preview.body : null,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setHistoryLogs((current) => [newLog, ...current].slice(0, 200));
  }

  async function sendWhatsApp(row: StudentRow, templateId?: string | null) {
    setLoadingId(`wa-${row.id}`);
    setFeedback((current) => ({ ...current, [row.id]: "" }));

    try {
      const variables = getVariables(row);
      const fallbackMessage = `Halo ${variables.name}, salam hangat dari tim kami. Kami siap membantu kebutuhan informasi Anda dengan singkat dan jelas.`;
      const previewBody = templateId
        ? renderInlineTemplate(waTemplates.find((template) => template.id === templateId)?.body_template ?? fallbackMessage, variables)
        : fallbackMessage;

      const response = await fetch("/api/wa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: row.id,
          to: row.telephone,
          templateId: templateId ?? undefined,
          message: templateId ? undefined : fallbackMessage,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal kirim WhatsApp.");
      }

      appendLocalHistory(row, "whatsapp", "sent", { body: previewBody, provider: payload?.data?.provider ?? "whatsapp" });
      setFeedback((current) => ({ ...current, [row.id]: "WhatsApp berhasil dikirim." }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal kirim WhatsApp.";
      appendLocalHistory(row, "whatsapp", "failed", { body: message, provider: "whatsapp" });
      setFeedback((current) => ({
        ...current,
        [row.id]: message,
      }));
    } finally {
      setLoadingId(null);
    }
  }

  async function sendEmail(row: StudentRow, templateId?: string | null) {
    if (!row.email) return;

    setLoadingId(`email-${row.id}`);
    setFeedback((current) => ({ ...current, [row.id]: "" }));

    try {
      const variables = getVariables(row);
      const chosenTemplate = templateId ? emailTemplates.find((template) => template.id === templateId) ?? null : null;
      const previewSubject = chosenTemplate
        ? renderInlineTemplate(chosenTemplate.subject_template, variables)
        : `Halo ${variables.name}, salam hangat dari tim kami`;
      const previewBody = chosenTemplate
        ? renderInlineTemplate(chosenTemplate.html_template, variables)
        : `<p>Halo ${variables.name},</p><p>Kami siap membantu kebutuhan informasi Anda dengan penjelasan yang ringkas, rapi, dan jelas.</p><p>Salam hangat,<br/>Tim TelemarkeTHINK</p>`;

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: row.id,
          to: row.email,
          templateId: templateId ?? undefined,
          subject: templateId ? undefined : previewSubject,
          html: templateId ? undefined : previewBody,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal kirim email.");
      }

      appendLocalHistory(row, "email", "sent", { subject: previewSubject, body: stripHtml(previewBody), provider: payload?.data?.provider ?? "resend" });
      setFeedback((current) => ({ ...current, [row.id]: "Email berhasil dikirim." }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal kirim email.";
      appendLocalHistory(row, "email", "failed", { subject: null, body: message, provider: "resend" });
      setFeedback((current) => ({
        ...current,
        [row.id]: message,
      }));
    } finally {
      setLoadingId(null);
    }
  }

  const relatedLogs = useMemo(() => {
    if (!selectedRow) return [];

    return historyLogs.filter((log) => {
      const meta = (log.provider_response?.recipient_meta ?? {}) as Record<string, unknown>;
      const metaStudentId = typeof meta.student_id === "string" ? meta.student_id : null;
      const metaPhone = typeof meta.phone === "string" ? normalizePhone(meta.phone) : "";
      const metaEmail = typeof meta.email === "string" ? meta.email.toLowerCase() : "";

      return (
        metaStudentId === selectedRow.id ||
        (selectedRow.telephone && metaPhone === normalizePhone(selectedRow.telephone)) ||
        (!!selectedRow.email && metaEmail === selectedRow.email.toLowerCase())
      );
    }).slice(0, 8);
  }, [historyLogs, selectedRow]);

  const waPreview = selectedRow && selectedWaTemplate
    ? renderInlineTemplate(selectedWaTemplate.body_template, getVariables(selectedRow))
    : null;

  const emailPreviewSubject = selectedRow && selectedEmailTemplate
    ? renderInlineTemplate(selectedEmailTemplate.subject_template, getVariables(selectedRow))
    : null;

  const emailPreviewHtml = selectedRow && selectedEmailTemplate
    ? renderInlineTemplate(selectedEmailTemplate.html_template, getVariables(selectedRow))
    : null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[1320px] text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="pb-3 pr-4 font-medium">Student</th>
              <th className="pb-3 pr-4 font-medium">Nick</th>
              <th className="pb-3 pr-4 font-medium">Parent</th>
              <th className="pb-3 pr-4 font-medium">Birthday</th>
              <th className="pb-3 pr-4 font-medium">Umur</th>
              <th className="pb-3 pr-4 font-medium">Gender</th>
              <th className="pb-3 pr-4 font-medium">Address</th>
              <th className="pb-3 pr-4 font-medium">Telephone</th>
              <th className="pb-3 pr-4 font-medium">Email</th>
              <th className="pb-3 pr-4 font-medium">Created</th>
              <th className="pb-3 pr-4 font-medium">Consent</th>
              <th className="pb-3 pr-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const waLoading = loadingId === `wa-${row.id}`;
              const emailLoading = loadingId === `email-${row.id}`;

              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelectedRow(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedRow(row);
                    }
                  }}
                  className="cursor-pointer border-b border-slate-100 align-top transition hover:bg-brand-50/40 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-slate-900">{row.student_name}</div>
                    <div className="mt-1 text-xs text-slate-500">Klik untuk lihat detail</div>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{row.nick_name || "-"}</td>
                  <td className="py-4 pr-4 text-slate-600">{row.parent || "-"}</td>
                  <td className="py-4 pr-4 text-slate-600">
                    <div>{row.birthday || (row.birthday_date ? formatDate(row.birthday_date) : "-")}</div>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{row.age ?? "-"}</td>
                  <td className="py-4 pr-4 text-slate-600">{row.gender || "-"}</td>
                  <td className="py-4 pr-4 text-slate-600">
                    <div className="max-w-[220px] whitespace-normal break-words">{row.address || "-"}</div>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{row.telephone}</td>
                  <td className="py-4 pr-4 text-slate-600">{row.email || "-"}</td>
                  <td className="py-4 pr-4 text-slate-600">{formatDate(row.created_at)}</td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge active={row.whatsapp_opt_in} label={`WA ${row.whatsapp_opt_in ? "Yes" : "No"}`} />
                      <Badge active={row.email_opt_in} label={`Email ${row.email_opt_in ? "Yes" : "No"}`} />
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex min-w-[180px] flex-col gap-2" onClick={(event) => event.stopPropagation()}>
                      <Button
                        type="button"
                        onClick={() => sendWhatsApp(row)}
                        disabled={!row.whatsapp_opt_in || waLoading}
                        className="justify-center"
                      >
                        {waLoading ? "Mengirim WA..." : "Kirim WA"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => sendEmail(row)}
                        disabled={!row.email_opt_in || !row.email || emailLoading}
                        className="justify-center"
                      >
                        {emailLoading ? "Mengirim Email..." : "Kirim Email"}
                      </Button>
                      {feedback[row.id] ? <div className="text-xs text-slate-500">{feedback[row.id]}</div> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedRow(null)} />
          <Card className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border-slate-200 shadow-2xl">
            <CardContent className="p-0">
              <div className="border-b border-slate-100 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-6 py-6 text-white">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/15 text-2xl font-semibold text-white shadow-lg">
                      {getInitials(selectedRow.student_name)}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.28em] text-brand-100">Detail siswa</div>
                      <h3 className="mt-2 text-2xl font-semibold leading-tight">{selectedRow.student_name}</h3>
                      <p className="mt-1 text-sm text-brand-100">
                        {selectedRow.parent ? `Orang tua: ${selectedRow.parent}` : "Profil kontak siswa"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge active={selectedRow.whatsapp_opt_in} label={`WhatsApp ${selectedRow.whatsapp_opt_in ? "Opt-in" : "Off"}`} />
                        <Badge active={selectedRow.email_opt_in} label={`Email ${selectedRow.email_opt_in ? "Opt-in" : "Off"}`} />
                        <Badge active={Boolean(selectedRow.birthday_date)} label={selectedRow.age !== null ? `${selectedRow.age} tahun` : "Umur belum tersedia"} />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRow(null)}
                    className="inline-flex h-11 w-11 items-center justify-center self-end rounded-2xl bg-white/10 text-xl transition hover:bg-white/20 lg:self-start"
                    aria-label="Close detail"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(92vh-118px)] overflow-y-auto px-6 py-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="Nama siswa" value={selectedRow.student_name} />
                  <DetailItem label="Nama panggilan" value={selectedRow.nick_name || "-"} />
                  <DetailItem label="Orang tua" value={selectedRow.parent || "-"} />
                  <DetailItem label="Tanggal lahir" value={selectedRow.birthday || formatDate(selectedRow.birthday_date)} />
                  <DetailItem label="Umur" value={selectedRow.age !== null ? `${selectedRow.age} tahun` : "-"} />
                  <DetailItem label="Gender" value={selectedRow.gender || "-"} />
                  <DetailItem label="Telepon" value={selectedRow.telephone} action={<CopyButton value={selectedRow.telephone} label="telepon" />} />
                  <DetailItem label="Email" value={selectedRow.email || "-"} action={<CopyButton value={selectedRow.email} label="email" />} />
                  <DetailItem label="Created at" value={formatDate(selectedRow.created_at, true)} />
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
                  <DetailItem label="Alamat" value={selectedRow.address || "-"} />
                  <DetailItem label="Aksi cepat" value="Pakai tombol cepat di bawah, atau kirim dengan template yang sudah dipreview." />
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">Kirim cepat</h4>
                      <p className="mt-1 text-sm text-slate-500">Aksi langsung ke kontak ini tanpa perlu menutup popup.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        onClick={() => sendWhatsApp(selectedRow)}
                        disabled={!selectedRow.whatsapp_opt_in || loadingId === `wa-${selectedRow.id}`}
                        className="min-w-[160px]"
                      >
                        {loadingId === `wa-${selectedRow.id}` ? "Mengirim WA..." : "Send WA"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => sendEmail(selectedRow)}
                        disabled={!selectedRow.email_opt_in || !selectedRow.email || loadingId === `email-${selectedRow.id}`}
                        className="min-w-[160px]"
                      >
                        {loadingId === `email-${selectedRow.id}` ? "Mengirim Email..." : "Send Email"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setSelectedRow(null)}>
                        Tutup
                      </Button>
                    </div>
                  </div>
                  {feedback[selectedRow.id] ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {feedback[selectedRow.id]}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-brand-50/40 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">Preview template WhatsApp</h4>
                        <p className="mt-1 text-sm text-slate-500">Pilih template, lihat preview, lalu kirim sekali klik.</p>
                      </div>
                      <select
                        value={selectedWaTemplate?.id ?? ""}
                        onChange={(event) => setSelectedWaTemplateId(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        {waTemplates.length ? waTemplates.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        )) : <option value="">Belum ada template WA</option>}
                      </select>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm">
                      {waPreview || "Belum ada template aktif. Kamu tetap bisa kirim pesan cepat dari tombol di atas."}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => sendWhatsApp(selectedRow, selectedWaTemplate?.id ?? null)}
                        disabled={!selectedRow.whatsapp_opt_in || !selectedWaTemplate || loadingId === `wa-${selectedRow.id}`}
                      >
                        {loadingId === `wa-${selectedRow.id}` ? "Mengirim WA..." : "Kirim dari template WA"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-sky-50/50 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">Preview template Email</h4>
                        <p className="mt-1 text-sm text-slate-500">Subject dan isi email akan mengikuti data siswa yang dipilih.</p>
                      </div>
                      <select
                        value={selectedEmailTemplate?.id ?? ""}
                        onChange={(event) => setSelectedEmailTemplateId(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        {emailTemplates.length ? emailTemplates.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        )) : <option value="">Belum ada template Email</option>}
                      </select>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Subject</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{emailPreviewSubject || "Belum ada template email aktif"}</div>
                      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">Preview isi</div>
                      <div className="mt-1 text-sm leading-7 text-slate-700">{emailPreviewHtml ? stripHtml(emailPreviewHtml) : "Belum ada template email aktif."}</div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => sendEmail(selectedRow, selectedEmailTemplate?.id ?? null)}
                        disabled={!selectedRow.email_opt_in || !selectedRow.email || !selectedEmailTemplate || loadingId === `email-${selectedRow.id}`}
                      >
                        {loadingId === `email-${selectedRow.id}` ? "Mengirim Email..." : "Kirim dari template Email"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">Histori pengiriman</h4>
                      <p className="mt-1 text-sm text-slate-500">Riwayat terbaru yang terhubung ke siswa ini dari log aplikasi.</p>
                    </div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{relatedLogs.length} item</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {relatedLogs.length ? relatedLogs.map((log) => {
                      const success = ["sent", "delivered", "read"].includes(log.status);
                      return (
                        <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge active={success} label={`${log.channel.toUpperCase()} • ${log.status}`} />
                              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{log.provider}</span>
                            </div>
                            <div className="text-xs text-slate-500">{formatDate(log.sent_at || log.created_at, true)}</div>
                          </div>
                          {log.subject ? <div className="mt-2 text-sm font-semibold text-slate-900">{log.subject}</div> : null}
                          <div className="mt-1 text-sm leading-6 text-slate-600">{log.body_preview || "-"}</div>
                          {log.error_message ? <div className="mt-2 text-xs text-rose-600">{log.error_message}</div> : null}
                        </div>
                      );
                    }) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        Belum ada histori kirim untuk kontak ini. Setelah kirim dari popup atau tabel, log baru akan muncul di sini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

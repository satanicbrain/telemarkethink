"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/src/components/layout/topbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input, Textarea } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { extractTemplateVariables, renderTemplate } from "@/src/lib/templates/render";
import { defaultWaTemplateSampleVariables, recommendedWaTemplatePresets } from "@/src/lib/templates/wa-presets";

type Template = {
  id: string;
  name: string;
  category: string | null;
  body_template: string;
  provider_template_key: string | null;
  language_code: string | null;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

type FormState = {
  id: string | null;
  name: string;
  category: string;
  bodyTemplate: string;
  providerTemplateKey: string;
  languageCode: string;
  isActive: boolean;
};

const CATEGORY_OPTIONS = ["Nasabah", "Business Partner", "Follow Up", "Lainnya"];

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  category: "Nasabah",
  bodyTemplate: "",
  providerTemplateKey: "",
  languageCode: "id",
  isActive: true,
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toFormState(template: Template): FormState {
  return {
    id: template.id,
    name: template.name,
    category: template.category || "Lainnya",
    bodyTemplate: template.body_template,
    providerTemplateKey: template.provider_template_key || "",
    languageCode: template.language_code || "id",
    isActive: template.is_active,
  };
}

export default function WaTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/templates/wa", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Gagal memuat template.");
      }

      const rows = (json.data ?? []) as Template[];
      setTemplates(rows);
      if (rows.length && !selectedId) {
        setSelectedId(rows[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat template.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return templates;
    return templates.filter((template) => {
      const haystack = [
        template.name,
        template.category || "",
        template.body_template,
        template.provider_template_key || "",
        ...(template.variables ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [templates, query]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const liveVariables = useMemo(() => extractTemplateVariables(form.bodyTemplate), [form.bodyTemplate]);
  const livePreview = useMemo(
    () => renderTemplate(form.bodyTemplate || "Halo {{name}}, salam hangat dari kami.", defaultWaTemplateSampleVariables),
    [form.bodyTemplate]
  );

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(template: Template) {
    setSelectedId(template.id);
    setForm(toFormState(template));
    setMessage("");
  }

  async function handleSeedDefaults() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/templates/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_defaults" }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Gagal menambahkan template rekomendasi.");
      }

      setMessage(json.message ?? "Template rekomendasi berhasil ditambahkan.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menambahkan template rekomendasi.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const isEdit = Boolean(form.id);
      const response = await fetch("/api/templates/wa", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Gagal menyimpan template.");
      }

      setMessage(json.message ?? "Template WhatsApp berhasil disimpan.");
      await loadData();
      if (json.data?.id) {
        setSelectedId(json.data.id);
      }
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const target = templates.find((template) => template.id === id);
    const ok = window.confirm(`Hapus template \"${target?.name ?? "ini"}\"?`);
    if (!ok) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/templates/wa?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Gagal menghapus template.");
      }

      setMessage(json.message ?? "Template berhasil dihapus.");
      if (selectedId === id) {
        setSelectedId(null);
      }
      if (form.id === id) {
        resetForm();
      }
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus template.");
    } finally {
      setSaving(false);
    }
  }

  const stats = useMemo(() => {
    const active = templates.filter((item) => item.is_active).length;
    const businessPartner = templates.filter((item) => (item.category || "").toLowerCase() === "business partner").length;
    return {
      total: templates.length,
      active,
      businessPartner,
      presets: recommendedWaTemplatePresets.length,
    };
  }, [templates]);

  return (
    <>
      <Topbar
        title="Template WhatsApp"
        subtitle="CRUD template WhatsApp lengkap, lengkap dengan template rekomendasi untuk reminder premi, ucapan, dan business partner."
        right={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Form baru
            </Button>
            <Button type="button" onClick={handleSeedDefaults} disabled={saving}>
              {saving ? "Memproses..." : "Import template rekomendasi"}
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total template", value: stats.total },
          { label: "Template aktif", value: stats.active },
          { label: "Business partner", value: stats.businessPartner },
          { label: "Paket rekomendasi", value: stats.presets },
        ].map((item) => (
          <Card key={item.label} className="border-slate-100">
            <CardContent className="py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.15fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Form template WA</h2>
                <p className="mt-1 text-sm text-slate-500">Bisa dipakai untuk create, update, dan duplikasi cepat.</p>
              </div>
              {form.id ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Mode edit</span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nama template</label>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="mis. auto_reminder_bayar_premi"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Kategori</label>
                  <Select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Body template</label>
                <Textarea
                  value={form.bodyTemplate}
                  onChange={(event) => setForm((current) => ({ ...current, bodyTemplate: event.target.value }))}
                  placeholder="Halo {{name}}, saya ingin mengingatkan..."
                  className="min-h-[180px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Provider template key</label>
                  <Input
                    value={form.providerTemplateKey}
                    onChange={(event) => setForm((current) => ({ ...current, providerTemplateKey: event.target.value }))}
                    placeholder="opsional, mis. template_meta_1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Language code</label>
                  <Input
                    value={form.languageCode}
                    onChange={(event) => setForm((current) => ({ ...current, languageCode: event.target.value }))}
                    placeholder="id"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  Aktifkan template ini
                </label>
                <div className="text-xs text-slate-500">Template aktif akan muncul di menu kirim WhatsApp pada daftar siswa.</div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Variabel terdeteksi</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {liveVariables.length ? liveVariables.map((variable) => (
                    <span key={variable} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                      {`{{${variable}}}`}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-500">
                      Belum ada placeholder. Tambahkan seperti {"{{name}}"} atau {"{{due_date}}"}.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Preview contoh</div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{livePreview}</div>
              </div>

              {message ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : form.id ? "Update template" : "Simpan template"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Reset form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Daftar template</h2>
                  <p className="mt-1 text-sm text-slate-500">Klik edit untuk memuat template ke form, atau hapus bila sudah tidak dipakai.</p>
                </div>
                <div className="w-full md:w-[280px]">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama, kategori, isi, atau variabel..."
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-slate-500">Memuat template WhatsApp...</div>
              ) : filteredTemplates.length ? (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => {
                    const variables = Array.isArray(template.variables)
                      ? template.variables
                      : extractTemplateVariables(template.body_template);

                    return (
                      <div
                        key={template.id}
                        className={cn(
                          "rounded-2xl border p-4 transition",
                          selectedId === template.id ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                {template.category || "Tanpa kategori"}
                              </span>
                              <span className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                template.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                              )}>
                                {template.is_active ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              provider key: {template.provider_template_key || "-"} • lang: {template.language_code || "id"} • update: {formatDate(template.updated_at || template.created_at)}
                            </div>
                            <div className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {template.body_template}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {variables.length ? variables.map((variable) => (
                                <span key={variable} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                  {`{{${variable}}}`}
                                </span>
                              )) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button type="button" variant="secondary" onClick={() => startEdit(template)}>
                              Edit
                            </Button>
                            <Button type="button" variant="danger" onClick={() => handleDelete(template.id)}>
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Belum ada template yang cocok dengan pencarian.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Paket template rekomendasi</h2>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendedWaTemplatePresets.map((preset) => {
                  const preview = renderTemplate(preset.bodyTemplate, defaultWaTemplateSampleVariables);
                  return (
                    <div key={preset.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{preset.name}</div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {preset.category}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{preset.description}</div>
                      <div className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {preview}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

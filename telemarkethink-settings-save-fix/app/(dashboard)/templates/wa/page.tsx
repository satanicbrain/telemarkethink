"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/src/components/layout/topbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input, Textarea } from "@/src/components/ui/input";

type Template = {
  id: string;
  name: string;
  body_template: string;
  provider_template_key: string | null;
  language_code: string | null;
};

export default function WaTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    bodyTemplate: "",
    providerTemplateKey: "",
    languageCode: "id",
  });

  async function loadData() {
    setLoading(true);
    const response = await fetch("/api/templates/wa");
    const json = await response.json();
    setTemplates(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/templates/wa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Gagal menyimpan template.");
      return;
    }

    setMessage("Template WA berhasil disimpan.");
    setForm({ name: "", bodyTemplate: "", providerTemplateKey: "", languageCode: "id" });
    loadData();
  }

  return (
    <>
      <Topbar
        title="Template WhatsApp"
        subtitle="Gunakan body template internal, dan isi provider template key bila provider mendukung template resmi."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Buat template WA</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nama template</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Body template</label>
                <Textarea
                  value={form.bodyTemplate}
                  onChange={(e) => setForm((p) => ({ ...p, bodyTemplate: e.target.value }))}
                  placeholder="Halo {{name}}, selamat ulang tahun..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Provider template key</label>
                <Input
                  value={form.providerTemplateKey}
                  onChange={(e) => setForm((p) => ({ ...p, providerTemplateKey: e.target.value }))}
                  placeholder="opsional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Language code</label>
                <Input
                  value={form.languageCode}
                  onChange={(e) => setForm((p) => ({ ...p, languageCode: e.target.value }))}
                />
              </div>

              {message ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}

              <Button type="submit">Simpan template</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Daftar template</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-slate-500">Memuat...</div>
            ) : templates.length ? (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-base font-semibold text-slate-900">{template.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      provider key: {template.provider_template_key ?? "-"} / lang: {template.language_code ?? "id"}
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{template.body_template}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Belum ada template WA.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/src/components/layout/topbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input, Textarea } from "@/src/components/ui/input";

type EmailTemplate = {
  id: string;
  name: string;
  subject_template: string;
  html_template: string;
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    subjectTemplate: "",
    htmlTemplate: "",
  });

  async function loadData() {
    setLoading(true);
    const response = await fetch("/api/templates/email");
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

    const response = await fetch("/api/templates/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Gagal menyimpan template email.");
      return;
    }

    setMessage("Template email berhasil disimpan.");
    setForm({ name: "", subjectTemplate: "", htmlTemplate: "" });
    loadData();
  }

  return (
    <>
      <Topbar
        title="Template Email"
        subtitle="Subject dan HTML bisa memakai placeholder seperti {{name}} dan {{product_interest}}."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Buat template email</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nama template</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject template</label>
                <Input
                  value={form.subjectTemplate}
                  onChange={(e) => setForm((p) => ({ ...p, subjectTemplate: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">HTML template</label>
                <Textarea
                  value={form.htmlTemplate}
                  onChange={(e) => setForm((p) => ({ ...p, htmlTemplate: e.target.value }))}
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
                    <div className="mt-1 text-sm font-medium text-slate-700">{template.subject_template}</div>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{template.html_template}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Belum ada template email.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

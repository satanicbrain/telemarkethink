"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/src/components/layout/topbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";

type Automation = {
  id: string;
  name: string;
  channel: "whatsapp" | "email";
  trigger_type: "birthday" | "follow_up" | "cron";
  delay_days: number | null;
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    channel: "whatsapp",
    triggerType: "birthday",
    delayDays: "7",
  });

  async function loadData() {
    const response = await fetch("/api/automations");
    const json = await response.json();
    setAutomations(json.data ?? []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Gagal menyimpan automation.");
      return;
    }

    setMessage("Automation berhasil disimpan.");
    setForm({ name: "", channel: "whatsapp", triggerType: "birthday", delayDays: "7" });
    loadData();
  }

  return (
    <>
      <Topbar title="Automations" subtitle="Starter automation siap untuk birthday dan follow-up." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Buat automation</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nama</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Channel</label>
                <Select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Trigger</label>
                <Select
                  value={form.triggerType}
                  onChange={(e) => setForm((p) => ({ ...p, triggerType: e.target.value }))}
                >
                  <option value="birthday">Birthday</option>
                  <option value="follow_up">Follow Up</option>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Delay days</label>
                <Input value={form.delayDays} onChange={(e) => setForm((p) => ({ ...p, delayDays: e.target.value }))} />
              </div>

              {message ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}

              <Button type="submit">Simpan automation</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Automation aktif</h2>
          </CardHeader>
          <CardContent>
            {automations.length ? (
              <div className="space-y-3">
                {automations.map((automation) => (
                  <div key={automation.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-base font-semibold text-slate-900">{automation.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {automation.channel} / {automation.trigger_type} / delay {automation.delay_days ?? 0} hari
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Belum ada automation.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

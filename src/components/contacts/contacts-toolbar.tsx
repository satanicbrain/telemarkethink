"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input, Textarea } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";

type StudentCreateForm = {
  no: string;
  student_name: string;
  nick_name: string;
  parent: string;
  birthday: string;
  gender: string;
  address: string;
  telephone: string;
  email: string;
  birthday_date: string;
  whatsapp_opt_in: boolean;
  email_opt_in: boolean;
  is_active: boolean;
  notes: string;
  tags: string;
};

const initialForm: StudentCreateForm = {
  no: "",
  student_name: "",
  nick_name: "",
  parent: "",
  birthday: "",
  gender: "",
  address: "",
  telephone: "",
  email: "",
  birthday_date: "",
  whatsapp_opt_in: true,
  email_opt_in: true,
  is_active: true,
  notes: "",
  tags: "",
};

export function ContactsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<StudentCreateForm>(initialForm);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const normalizedTags = useMemo(
    () => form.tags.split(",").map((item) => item.trim()).filter(Boolean),
    [form.tags]
  );

  function update<K extends keyof StudentCreateForm>(key: K, value: StudentCreateForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: normalizedTags,
        }),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Gagal menyimpan kontak baru.");
      }

      setSuccess(`Kontak ${payload?.data?.student_name ?? form.student_name} berhasil ditambahkan.`);
      setForm(initialForm);
      router.push("/contacts?page=1");
      router.refresh();
      window.setTimeout(() => {
        setOpen(false);
        setSuccess(null);
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan kontak.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
        <form action="/contacts" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Cari student, parent, telepon, email, atau alamat"
            className="min-w-[260px] bg-white"
          />
          <Button type="submit">Cari</Button>
        </form>

        <Button type="button" className="whitespace-nowrap" onClick={() => setOpen(true)}>
          + Input kontak
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Input kontak</div>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">Tambah siswa / nasabah baru</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Data akan disimpan ke tabel <span className="font-medium text-slate-700">telemarket_students</span> dan langsung bisa dipakai untuk WA, email, serta automation.
                </p>
              </div>
              <Button type="button" variant="ghost" className="h-11 w-11 rounded-2xl px-0 text-xl" onClick={() => setOpen(false)}>
                ×
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">No / kode</label>
                  <Input value={form.no} onChange={(e) => update("no", e.target.value)} placeholder="Opsional" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nama siswa</label>
                  <Input value={form.student_name} onChange={(e) => update("student_name", e.target.value)} placeholder="Wajib diisi" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nama panggilan</label>
                  <Input value={form.nick_name} onChange={(e) => update("nick_name", e.target.value)} placeholder="Opsional" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nama orang tua</label>
                  <Input value={form.parent} onChange={(e) => update("parent", e.target.value)} placeholder="Ayah / Ibu / Wali" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nomor telepon</label>
                  <Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} placeholder="Contoh: +62812..." required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal lahir</label>
                  <Input type="date" value={form.birthday_date} onChange={(e) => update("birthday_date", e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Label tanggal lahir</label>
                  <Input value={form.birthday} onChange={(e) => update("birthday", e.target.value)} placeholder="Contoh: 3 April 2012" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                  <Select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                    <option value="">Pilih gender</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Alamat</label>
                  <Textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Alamat lengkap" className="min-h-[120px]" />
                </div>
                <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Tags</label>
                    <Input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="vip, sekolah-a, followup" />
                    <p className="mt-2 text-xs text-slate-500">Pisahkan dengan koma. Tag membantu pencarian dan segmentasi.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Catatan internal</label>
                    <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Keterangan tambahan, preferensi, atau konteks prospek" className="min-h-[108px]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={form.whatsapp_opt_in} onChange={(e) => update("whatsapp_opt_in", e.target.checked)} />
                  WhatsApp opt-in
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={form.email_opt_in} onChange={(e) => update("email_opt_in", e.target.checked)} />
                  Email opt-in
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
                  Kontak aktif
                </label>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">Setelah disimpan, kontak langsung muncul di halaman ini dan siap dipakai untuk kirim WA/email.</div>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan kontak"}</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

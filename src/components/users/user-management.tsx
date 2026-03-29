"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/src/components/layout/topbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";

type UserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "admin" | "operator";
  createdAt: string | null;
  lastSignInAt: string | null;
};

export function UserManagement({
  currentUserId,
  currentUserRole,
  currentUserEmail,
  currentUserName,
  canManageUsers,
  bootstrapMode,
}: {
  currentUserId: string;
  currentUserRole: "admin" | "operator";
  currentUserEmail: string | null;
  currentUserName: string | null;
  canManageUsers: boolean;
  bootstrapMode: boolean;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "operator" as "admin" | "operator",
  });

  async function loadUsers() {
    if (!canManageUsers) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Gagal memuat user.");
      }

      setUsers(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat user.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [canManageUsers]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) => {
      return [user.fullName, user.email, user.role].some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [query, users]);

  async function updateRole(userId: string, role: "admin" | "operator") {
    setSavingUserId(userId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Gagal mengubah role user.");
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
      setMessage(`Role berhasil diubah menjadi ${role}. Kalau ini akun kamu sendiri, logout lalu login lagi supaya akses ikut segar.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah role user.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Gagal membuat user baru.");
      }

      const newUser = json.data as UserRow;
      setUsers((prev) => [newUser, ...prev]);
      setForm({ fullName: "", email: "", password: "", role: "operator" });
      setMessage(`User ${newUser.email ?? "baru"} berhasil dibuat sebagai ${newUser.role}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat user baru.");
    } finally {
      setCreating(false);
    }
  }

  const currentUser = useMemo(
    () => users.find((item) => item.id === currentUserId) ?? null,
    [currentUserId, users]
  );

  return (
    <>
      <Topbar
        title="Kelola User"
        subtitle="Tambah operator atau admin baru, lalu atur rolenya langsung dari dashboard tanpa buka SQL Editor."
        right={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, atau role"
              className="w-full sm:w-72"
            />
            <Button variant="secondary" onClick={loadUsers} disabled={loading}>
              {loading ? "Memuat..." : "Refresh"}
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {!canManageUsers ? (
          <div className="xl:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Halaman ini hanya bisa mengubah user saat kamu sudah admin. Untuk bootstrap admin pertama, pastikan belum ada akun admin sama sekali lalu buka lagi halaman ini. Kalau admin sudah ada, masuklah dengan akun admin itu.
          </div>
        ) : null}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Akun aktif sekarang</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ini identitas yang sedang dipakai di dashboard. Kalau role masih belum berubah, biasanya cukup logout lalu login lagi.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Info label="Nama" value={currentUser?.fullName ?? currentUserName ?? "-"} />
            <Info label="Email" value={currentUser?.email ?? currentUserEmail ?? "-"} />
            <Info label="Role sekarang" value={currentUser?.role ?? currentUserRole} accent />
            <Info label="User ID" value={currentUserId} compact />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Tambah user baru</h2>
            <p className="mt-1 text-sm text-slate-500">
              Buat akun login baru sekaligus tentukan apakah dia operator atau admin.
              {bootstrapMode ? " Saat ini belum ada admin, jadi halaman ini sedang berada di mode bootstrap admin pertama." : ""}
            </p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={createUser}>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                placeholder="Nama lengkap"
                required
                disabled={!canManageUsers || creating}
              />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                placeholder="Email login"
                required
                disabled={!canManageUsers || creating}
              />
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                placeholder="Password minimal 8 karakter"
                required
                minLength={8}
                disabled={!canManageUsers || creating}
              />
              <Select
                value={form.role}
                onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as "admin" | "operator" }))}
                disabled={!canManageUsers || creating}
              >
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </Select>
              <div className="flex justify-end">
                <Button type="submit" disabled={!canManageUsers || creating}>
                  {creating ? "Membuat user..." : "Tambah user"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Daftar user</h2>
          <p className="mt-1 text-sm text-slate-500">
            Role aplikasi tersimpan di tabel <code>profiles</code>. Untuk admin pertama, kamu juga bisa set lewat SQL lalu refresh halaman ini.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="pb-3 pr-4">Nama</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Dibuat</th>
                  <th className="pb-3 pr-4">Last sign in</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {user.fullName ?? "-"}
                        {isCurrentUser ? (
                          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">Akun aktif</div>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{user.email ?? "-"}</td>
                      <td className="py-3 pr-4">
                        <Select
                          value={user.role}
                          disabled={!canManageUsers || savingUserId === user.id}
                          onChange={(e) => updateRole(user.id, e.target.value as "admin" | "operator")}
                          className="min-w-[140px]"
                        >
                          <option value="admin">admin</option>
                          <option value="operator">operator</option>
                        </Select>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(user.lastSignInAt)}</td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          disabled={!canManageUsers || loading || savingUserId === user.id}
                          onClick={() => updateRole(user.id, user.role === "admin" ? "operator" : "admin")}
                        >
                          {savingUserId === user.id ? "Menyimpan..." : user.role === "admin" ? "Jadikan operator" : "Jadikan admin"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && !filteredUsers.length ? (
              <div className="py-10 text-center text-sm text-slate-500">Tidak ada user yang cocok.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function Info({
  label,
  value,
  accent = false,
  compact = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${accent ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className={`mt-1 break-all text-sm ${compact ? "font-mono text-xs text-slate-600" : accent ? "font-semibold text-brand-700" : "text-slate-700"}`}>{value}</div>
    </div>
  );
}

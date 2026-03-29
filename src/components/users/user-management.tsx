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

export function UserManagement({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
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
  }, []);

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
      setMessage(`Role berhasil diubah menjadi ${role}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah role user.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <>
      <Topbar
        title="Kelola User"
        subtitle="Ubah role admin atau operator langsung dari dashboard tanpa buka SQL Editor."
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
            Role tersimpan di tabel profiles. Setelah diubah, label role di layout akan ikut diperbarui.
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
                          disabled={savingUserId === user.id}
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
                          disabled={loading || savingUserId === user.id}
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

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Sidebar } from "@/src/components/layout/sidebar";
import { Button } from "@/src/components/ui/button";

type AppRole = "admin" | "operator";

type Viewer = {
  role: AppRole;
  email: string | null;
  fullName: string | null;
};

export function DashboardShell({
  role,
  email,
  fullName,
  bootstrapMode,
  children,
}: {
  role: AppRole;
  email: string | null;
  fullName: string | null;
  bootstrapMode: boolean;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewer, setViewer] = useState<Viewer>({ role, email, fullName });

  useEffect(() => {
    let active = true;

    async function loadViewer() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json?.data || !active) return;
        setViewer({
          role: json.data.role,
          email: json.data.email ?? null,
          fullName: json.data.fullName ?? null,
        });
      } catch {
        // keep initial server state
      }
    }

    loadViewer();
    return () => {
      active = false;
    };
  }, []);

  const displayName = useMemo(() => viewer.fullName ?? viewer.email ?? "User", [viewer.email, viewer.fullName]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        role={viewer.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showUsersShortcut={bootstrapMode}
      />

      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Open menu"
              >
                <span className="text-xl leading-none">☰</span>
              </button>
              <div>
                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{viewer.role}</div>
              </div>
            </div>

            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="secondary">Logout</Button>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/cn";

const baseItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Kontak" },
  { href: "/templates/wa", label: "Template WA" },
  { href: "/templates/email", label: "Template Email" },
  { href: "/automations", label: "Automations" },
  { href: "/logs", label: "Logs" },
  { href: "/settings/providers", label: "Settings" },
];

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: "admin" | "operator";
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = role === "admin"
    ? [...baseItems, { href: "/users", label: "Kelola User" }]
    : baseItems;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-[19rem] border-r border-slate-200 bg-white/95 shadow-soft transition-transform duration-300">
        <div className="flex min-h-screen flex-col p-5">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-5 py-6 text-white shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-brand-100">TelemarkeTHINK</div>
                <div className="mt-2 text-2xl font-semibold leading-tight">WA & Email Automation</div>
                <p className="mt-2 text-sm text-brand-100">
                  Komunikasi bisnis yang rapi, personal, dan aman.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl text-white transition hover:bg-white/20"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
          </div>

          <nav className="mt-6 space-y-1.5">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700 shadow-sm"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Provider WhatsApp bisa diganti dari settings. Kontak kini fokus ke data siswa dan orang tua dengan aksi cepat dari tabel.
          </div>
        </div>
      </aside>
    </>
  );
}

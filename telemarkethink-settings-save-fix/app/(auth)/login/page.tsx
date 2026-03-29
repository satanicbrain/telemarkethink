"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-brand-100">TelemarkeTHINK</div>
        <div className="max-w-xl">
          <h1 className="text-5xl font-semibold leading-tight">
            WA & Email automation yang rapi untuk bisnis asuransi.
          </h1>
          <p className="mt-5 text-lg text-brand-100">
            Fokus pada komunikasi personal, follow up yang sopan, dan pengelolaan provider tanpa bongkar kode.
          </p>
        </div>
        <div className="text-sm text-brand-100">Deploy di Vercel. Data dan auth di Supabase.</div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin Access</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Masuk ke dashboard</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Masuk..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

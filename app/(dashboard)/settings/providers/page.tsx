"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/src/components/layout/topbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input, Textarea } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";

type MaskedSettings = {
  channel: "whatsapp" | "email";
  provider: string | null;
  publicConfig: Record<string, any>;
  secretFieldsStored: Record<string, boolean>;
  updatedAt: string | null;
};

type Notice = {
  type: "success" | "error";
  text: string;
};

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || "Server tidak mengembalikan respons JSON." };
}

export default function ProviderSettingsPage() {
  const [wa, setWa] = useState<MaskedSettings | null>(null);
  const [email, setEmail] = useState<MaskedSettings | null>(null);
  const [pageMessage, setPageMessage] = useState<Notice | null>(null);
  const [waMessage, setWaMessage] = useState<Notice | null>(null);
  const [emailMessage, setEmailMessage] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [waSaving, setWaSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [waForm, setWaForm] = useState({
    provider: "meta_cloud_api",
    graphApiVersion: "v23.0",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    accessToken: "",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    baseUrl: "",
    apiKey: "",
    sender: "",
    extraHeadersJson: "",
  });
  const [emailForm, setEmailForm] = useState({
    provider: "resend",
    fromEmail: "",
    apiKey: "",
  });

  async function loadData() {
    setLoading(true);
    setPageMessage(null);

    try {
      const [waResponse, emailResponse] = await Promise.all([
        fetch("/api/settings/whatsapp", { cache: "no-store" }),
        fetch("/api/settings/email", { cache: "no-store" }),
      ]);

      const waJson = await parseResponse(waResponse);
      const emailJson = await parseResponse(emailResponse);

      if (!waResponse.ok) {
        throw new Error(waJson.error ?? "Gagal memuat settings WhatsApp.");
      }

      if (!emailResponse.ok) {
        throw new Error(emailJson.error ?? "Gagal memuat settings email.");
      }

      setWa(waJson.data);
      setEmail(emailJson.data);

      if (waJson.data) {
        setWaForm((prev) => ({
          ...prev,
          provider: waJson.data.provider ?? "meta_cloud_api",
          graphApiVersion: waJson.data.publicConfig?.graphApiVersion ?? "v23.0",
          phoneNumberId: waJson.data.publicConfig?.phoneNumberId ?? "",
          businessAccountId: waJson.data.publicConfig?.businessAccountId ?? "",
          accountSid: waJson.data.publicConfig?.accountSid ?? "",
          fromNumber: waJson.data.publicConfig?.fromNumber ?? "",
          baseUrl: waJson.data.publicConfig?.baseUrl ?? "",
          sender: waJson.data.publicConfig?.sender ?? "",
          extraHeadersJson: waJson.data.publicConfig?.extraHeadersJson ?? "",
          accessToken: "",
          webhookVerifyToken: "",
          authToken: "",
          apiKey: "",
        }));
      }

      if (emailJson.data) {
        setEmailForm((prev) => ({
          ...prev,
          provider: emailJson.data.provider ?? "resend",
          fromEmail: emailJson.data.publicConfig?.fromEmail ?? "",
          apiKey: "",
        }));
      }
    } catch (error) {
      setPageMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal memuat settings provider.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveWhatsApp(event: React.FormEvent) {
    event.preventDefault();
    setWaSaving(true);
    setWaMessage(null);
    setPageMessage(null);

    try {
      const provider = waForm.provider;
      let payload: Record<string, any> = {
        provider,
        publicConfig: {},
        secretConfig: {},
      };

      if (provider === "meta_cloud_api") {
        payload = {
          provider,
          publicConfig: {
            graphApiVersion: waForm.graphApiVersion,
            phoneNumberId: waForm.phoneNumberId,
            businessAccountId: waForm.businessAccountId,
          },
          secretConfig: {
            ...(waForm.accessToken ? { accessToken: waForm.accessToken } : {}),
            ...(waForm.webhookVerifyToken ? { webhookVerifyToken: waForm.webhookVerifyToken } : {}),
          },
        };
      }

      if (provider === "twilio_whatsapp") {
        payload = {
          provider,
          publicConfig: {
            accountSid: waForm.accountSid,
            fromNumber: waForm.fromNumber,
          },
          secretConfig: {
            ...(waForm.authToken ? { authToken: waForm.authToken } : {}),
          },
        };
      }

      if (provider === "custom_http") {
        payload = {
          provider,
          publicConfig: {
            baseUrl: waForm.baseUrl,
            sender: waForm.sender,
            extraHeadersJson: waForm.extraHeadersJson,
          },
          secretConfig: {
            ...(waForm.apiKey ? { apiKey: waForm.apiKey } : {}),
          },
        };
      }

      const response = await fetch("/api/settings/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await parseResponse(response);

      if (!response.ok) {
        throw new Error(json.error ?? "Gagal menyimpan settings WhatsApp.");
      }

      setWaMessage({ type: "success", text: "Settings WhatsApp tersimpan." });
      await loadData();
    } catch (error) {
      setWaMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal menyimpan settings WhatsApp.",
      });
    } finally {
      setWaSaving(false);
    }
  }

  async function saveEmail(event: React.FormEvent) {
    event.preventDefault();
    setEmailSaving(true);
    setEmailMessage(null);
    setPageMessage(null);

    try {
      const response = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "resend",
          publicConfig: { fromEmail: emailForm.fromEmail },
          secretConfig: {
            ...(emailForm.apiKey ? { apiKey: emailForm.apiKey } : {}),
          },
        }),
      });

      const json = await parseResponse(response);

      if (!response.ok) {
        throw new Error(json.error ?? "Gagal menyimpan settings email.");
      }

      setEmailMessage({ type: "success", text: "Settings email tersimpan." });
      await loadData();
    } catch (error) {
      setEmailMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal menyimpan settings email.",
      });
    } finally {
      setEmailSaving(false);
    }
  }

  return (
    <>
      <Topbar
        title="Provider Settings"
        subtitle="Pilih provider WhatsApp langsung dari panel ini. Tidak perlu bongkar kode."
      />

      {pageMessage ? (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm shadow-soft ${
            pageMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {pageMessage.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">WhatsApp Provider</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih provider aktif. Field secret dikosongkan kalau tidak ingin diubah.
            </p>
          </CardHeader>
          <CardContent>
            {waMessage ? (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  waMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {waMessage.text}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={saveWhatsApp}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Provider</label>
                <Select
                  value={waForm.provider}
                  onChange={(e) => setWaForm((p) => ({ ...p, provider: e.target.value }))}
                  disabled={waSaving || loading}
                >
                  <option value="meta_cloud_api">Meta Cloud API</option>
                  <option value="twilio_whatsapp">Twilio WhatsApp</option>
                  <option value="custom_http">Custom HTTP Gateway</option>
                </Select>
              </div>

              {waForm.provider === "meta_cloud_api" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Graph API version</label>
                    <Input disabled={waSaving || loading} value={waForm.graphApiVersion} onChange={(e) => setWaForm((p) => ({ ...p, graphApiVersion: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Phone number ID</label>
                    <Input disabled={waSaving || loading} value={waForm.phoneNumberId} onChange={(e) => setWaForm((p) => ({ ...p, phoneNumberId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Business account ID</label>
                    <Input disabled={waSaving || loading} value={waForm.businessAccountId} onChange={(e) => setWaForm((p) => ({ ...p, businessAccountId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Access token {wa?.secretFieldsStored?.accessToken ? "(sudah tersimpan)" : ""}
                    </label>
                    <Input disabled={waSaving || loading} type="password" value={waForm.accessToken} onChange={(e) => setWaForm((p) => ({ ...p, accessToken: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Webhook verify token {wa?.secretFieldsStored?.webhookVerifyToken ? "(sudah tersimpan)" : ""}
                    </label>
                    <Input disabled={waSaving || loading} type="password" value={waForm.webhookVerifyToken} onChange={(e) => setWaForm((p) => ({ ...p, webhookVerifyToken: e.target.value }))} />
                  </div>
                </>
              ) : null}

              {waForm.provider === "twilio_whatsapp" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Account SID</label>
                    <Input disabled={waSaving || loading} value={waForm.accountSid} onChange={(e) => setWaForm((p) => ({ ...p, accountSid: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Auth token {wa?.secretFieldsStored?.authToken ? "(sudah tersimpan)" : ""}
                    </label>
                    <Input disabled={waSaving || loading} type="password" value={waForm.authToken} onChange={(e) => setWaForm((p) => ({ ...p, authToken: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      From number (format whatsapp:+14155238886)
                    </label>
                    <Input disabled={waSaving || loading} value={waForm.fromNumber} onChange={(e) => setWaForm((p) => ({ ...p, fromNumber: e.target.value }))} />
                  </div>
                </>
              ) : null}

              {waForm.provider === "custom_http" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Base URL</label>
                    <Input disabled={waSaving || loading} value={waForm.baseUrl} onChange={(e) => setWaForm((p) => ({ ...p, baseUrl: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      API key {wa?.secretFieldsStored?.apiKey ? "(sudah tersimpan)" : ""}
                    </label>
                    <Input disabled={waSaving || loading} type="password" value={waForm.apiKey} onChange={(e) => setWaForm((p) => ({ ...p, apiKey: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Sender</label>
                    <Input disabled={waSaving || loading} value={waForm.sender} onChange={(e) => setWaForm((p) => ({ ...p, sender: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Extra headers JSON</label>
                    <Textarea disabled={waSaving || loading} value={waForm.extraHeadersJson} onChange={(e) => setWaForm((p) => ({ ...p, extraHeadersJson: e.target.value }))} />
                  </div>
                </>
              ) : null}

              <Button type="submit" disabled={waSaving || loading}>
                {waSaving ? "Menyimpan WhatsApp..." : "Simpan settings WhatsApp"}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">Webhook endpoints</div>
              <div className="mt-2">Meta: /api/webhooks/whatsapp</div>
              <div>Twilio: /api/webhooks/twilio/whatsapp</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Email Provider</h2>
            <p className="mt-1 text-sm text-slate-500">Default provider: Resend.</p>
          </CardHeader>
          <CardContent>
            {emailMessage ? (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  emailMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {emailMessage.text}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={saveEmail}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Provider</label>
                <Input value="resend" disabled />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">From email</label>
                <Input disabled={emailSaving || loading} value={emailForm.fromEmail} onChange={(e) => setEmailForm((p) => ({ ...p, fromEmail: e.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  API key {email?.secretFieldsStored?.apiKey ? "(sudah tersimpan)" : ""}
                </label>
                <Input disabled={emailSaving || loading} type="password" value={emailForm.apiKey} onChange={(e) => setEmailForm((p) => ({ ...p, apiKey: e.target.value }))} />
              </div>

              <Button type="submit" disabled={emailSaving || loading}>
                {emailSaving ? "Menyimpan Email..." : "Simpan settings Email"}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">Webhook endpoint</div>
              <div className="mt-2">Resend: /api/webhooks/resend</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

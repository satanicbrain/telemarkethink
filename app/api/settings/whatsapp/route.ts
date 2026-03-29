import { NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth";
import { getMaskedSettings, toReadableErrorMessage, upsertChannelSetting } from "@/src/lib/settings/repository";
import { whatsappSettingsSchema } from "@/src/lib/validations/settings";

export async function GET() {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const data = await getMaskedSettings("whatsapp");
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: toReadableErrorMessage(error, "Gagal memuat settings WhatsApp.") },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const body = await request.json();
    const parsed = whatsappSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input settings WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    const data = await upsertChannelSetting({
      channel: "whatsapp",
      provider: parsed.data.provider,
      publicConfig: parsed.data.publicConfig,
      secretConfig: parsed.data.secretConfig,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ data, message: "Settings WhatsApp tersimpan." });
  } catch (error) {
    return NextResponse.json(
      { error: toReadableErrorMessage(error, "Terjadi kesalahan saat menyimpan provider settings.") },
      { status: 500 }
    );
  }
}

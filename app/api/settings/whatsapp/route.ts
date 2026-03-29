import { NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth";
import { getMaskedSettings, upsertChannelSetting } from "@/src/lib/settings/repository";
import { whatsappSettingsSchema } from "@/src/lib/validations/settings";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan saat memproses settings WhatsApp.";
}

export async function GET() {
  try {
    const auth = await requireApiUser(["admin", "operator"]);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const data = await getMaskedSettings("whatsapp");
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireApiUser(["admin", "operator"]);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const body = await request.json();
    const parsed = whatsappSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const data = await upsertChannelSetting({
      channel: "whatsapp",
      provider: parsed.data.provider,
      publicConfig: parsed.data.publicConfig,
      secretConfig: parsed.data.secretConfig,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

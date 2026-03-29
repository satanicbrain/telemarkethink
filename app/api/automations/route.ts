import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/src/lib/auth";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  channel: z.enum(["whatsapp", "email"]),
  triggerType: z.enum(["birthday", "follow_up"]),
  delayDays: z.string().optional().default("7"),
});

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("automations").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("automations")
    .insert({
      name: parsed.data.name,
      channel: parsed.data.channel,
      trigger_type: parsed.data.triggerType,
      delay_days: Number(parsed.data.delayDays || 7),
      is_active: true,
      filters: {},
      quiet_hours: { start: "20:00", end: "08:00" },
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

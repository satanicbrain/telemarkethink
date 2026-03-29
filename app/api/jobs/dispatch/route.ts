import { NextResponse } from "next/server";
import { dispatchAutomations } from "@/src/lib/scheduler/dispatch";
import { assertCronRequest } from "@/src/lib/security/cron";

async function handle() {
  await assertCronRequest();
  const data = await dispatchAutomations();
  return NextResponse.json({ ok: true, data });
}

export async function GET() {
  try {
    return await handle();
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Dispatch failed" }, { status: 401 });
  }
}

export async function POST() {
  return GET();
}

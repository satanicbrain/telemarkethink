import { NextResponse } from "next/server";
import { processQueue } from "@/src/lib/scheduler/process";
import { assertCronRequest } from "@/src/lib/security/cron";

async function handle() {
  await assertCronRequest();
  const data = await processQueue(25);
  return NextResponse.json({ ok: true, data });
}

export async function GET() {
  try {
    return await handle();
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Process failed" }, { status: 401 });
  }
}

export async function POST() {
  return GET();
}

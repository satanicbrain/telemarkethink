import { NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth";

export async function GET() {
  const auth = await requireApiUser(["admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  return NextResponse.json({ data: auth.user });
}

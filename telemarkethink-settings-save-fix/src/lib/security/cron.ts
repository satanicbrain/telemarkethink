import { headers } from "next/headers";

export async function assertCronRequest() {
  const incomingHeaders = await headers();
  const auth = incomingHeaders.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  if (auth !== `Bearer ${secret}`) {
    throw new Error("Invalid cron authorization.");
  }
}

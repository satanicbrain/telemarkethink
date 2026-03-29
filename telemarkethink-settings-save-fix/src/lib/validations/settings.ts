import { z } from "zod";

export const whatsappSettingsSchema = z.object({
  provider: z.enum(["meta_cloud_api", "twilio_whatsapp", "custom_http"]),
  publicConfig: z.record(z.string(), z.any()).default({}),
  secretConfig: z.record(z.string(), z.string()).default({}),
});

export const emailSettingsSchema = z.object({
  provider: z.literal("resend"),
  publicConfig: z.record(z.string(), z.any()).default({}),
  secretConfig: z.record(z.string(), z.string()).default({}),
});

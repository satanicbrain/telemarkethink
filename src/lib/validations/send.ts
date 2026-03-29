import { z } from "zod";

export const sendWhatsAppSchema = z.object({
  contactId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  to: z.string().optional(),
  templateId: z.string().uuid().optional(),
  message: z.string().optional(),
});

export const sendEmailSchema = z.object({
  contactId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  to: z.string().email().optional(),
  templateId: z.string().uuid().optional(),
  subject: z.string().optional(),
  html: z.string().optional(),
});

export function normalizeToWhatsAppAddress(input: string) {
  if (input.startsWith("whatsapp:")) return input;
  if (input.startsWith("+")) return `whatsapp:${input}`;
  return `whatsapp:+${input.replace(/[^\d]/g, "")}`;
}

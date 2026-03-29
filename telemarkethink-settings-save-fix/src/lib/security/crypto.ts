import crypto from "node:crypto";

function getEncryptionKey() {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error("APP_ENCRYPTION_KEY must be set and at least 32 characters.");
  }

  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptJson(value: unknown) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptJson<T>(payload?: string | null): T | null {
  if (!payload) return null;

  const key = getEncryptionKey();
  const input = Buffer.from(payload, "base64");

  const iv = input.subarray(0, 12);
  const tag = input.subarray(12, 28);
  const encrypted = input.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}

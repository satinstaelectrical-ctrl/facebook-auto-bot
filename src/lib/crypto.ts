import crypto from "crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

/**
 * Derives a 32-byte key from SESSION_SECRET to encrypt user API keys securely.
 */
function getKey(): Buffer {
  return crypto.createHash("sha256").update(env.sessionSecret).digest();
}

/**
 * Encrypts sensitive secrets (OpenAI, Anthropic, Gemini, OpenRouter keys) with AES-256-GCM.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText || !plainText.trim()) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plainText.trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted secret.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText || !cipherText.includes(":")) return "";
  try {
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) return "";
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[decryptSecret] Failed to decrypt:", err);
    return "";
  }
}

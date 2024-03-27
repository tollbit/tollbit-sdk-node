import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export function encrypt(plaintext: string, keyString: string): string {
  const key = Buffer.from(keyString, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + encrypted.toString("hex") + tag.toString("hex");
}

export function decrypt(encryptedString: string, keyString: string): string {
  const key = Buffer.from(keyString, "hex");
  const encrypted = Buffer.from(encryptedString, "hex");
  const iv = encrypted.slice(0, 12); // Use 12 bytes for the IV
  const tag = encrypted.slice(-16); // Use the last 16 bytes for the tag
  const ciphertext = encrypted.slice(12, -16); // The remaining bytes are the ciphertext
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

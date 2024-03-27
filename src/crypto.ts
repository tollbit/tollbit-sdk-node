import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export function encrypt(plaintext: string, keyString: string): string {
  const key = Buffer.from(keyString, "hex");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + tag.toString("hex") + encrypted.toString("hex");
}

export function decrypt(encryptedString: string, keyString: string): string {
  const key = Buffer.from(keyString, "hex");
  const encrypted = Buffer.from(encryptedString, "hex");
  const iv = encrypted.slice(0, 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  const tag = encrypted.slice(16, 32);
  const ciphertext = encrypted.slice(32);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

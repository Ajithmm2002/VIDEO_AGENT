import { randomBytes } from "node:crypto";

/** 32 random bytes as URL-safe text (43 characters). Used for private share and calendar links. */
export function newSecretToken() {
  return randomBytes(32).toString("base64url");
}

export function isSecretToken(value: string) {
  return /^[A-Za-z0-9_-]{32,64}$/.test(value);
}

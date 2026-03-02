/**
 * Optional client-side AES-GCM encryption helper for zero-knowledge push flow.
 * Encrypts the payload locally before send; the server stores opaque ciphertext.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const SALT_LEN = 16;

export interface EncryptPayloadResult {
  encryptedPayload: string;
  encryptionAlgorithm: string;
  encryptionIv: string;
  encryptionAuthTag: string;
}

/**
 * Encrypts a payload with AES-256-GCM using a secret (password or key material).
 * Returns the fields needed for V1PayloadEnvelope in client-encrypted mode.
 */
export function encryptPayload(
  plaintext: object,
  secret: string | Buffer,
): EncryptPayloadResult {
  const key =
    typeof secret === "string"
      ? scryptSync(secret, "poofmq-salt", KEY_LEN)
      : Buffer.isBuffer(secret) && secret.length >= KEY_LEN
        ? secret.subarray(0, KEY_LEN)
        : scryptSync(secret as Buffer, "poofmq-salt", KEY_LEN);

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LEN });

  const payloadBytes = Buffer.from(JSON.stringify(plaintext), "utf8");
  const encrypted = Buffer.concat([cipher.update(payloadBytes), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedPayload: encrypted.toString("base64"),
    encryptionAlgorithm: ALGORITHM,
    encryptionIv: iv.toString("base64"),
    encryptionAuthTag: authTag.toString("base64"),
  };
}

/**
 * Decrypts a payload encrypted with encryptPayload (e.g. from a popped message).
 */
export function decryptPayload(
  encryptedPayload: string,
  encryptionIv: string,
  encryptionAuthTag: string,
  secret: string | Buffer,
): object {
  const key =
    typeof secret === "string"
      ? scryptSync(secret, "poofmq-salt", KEY_LEN)
      : Buffer.isBuffer(secret) && secret.length >= KEY_LEN
        ? secret.subarray(0, KEY_LEN)
        : scryptSync(secret as Buffer, "poofmq-salt", KEY_LEN);

  const iv = Buffer.from(encryptionIv, "base64");
  const authTag = Buffer.from(encryptionAuthTag, "base64");
  const encrypted = Buffer.from(encryptedPayload, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LEN });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as object;
}

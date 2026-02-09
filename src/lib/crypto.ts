import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_VERSION = 1;

function getMasterKey(): Buffer {
  const raw = process.env.OPENAI_KEY_ENCRYPTION_SECRET;
  if (!raw) {
    throw new Error('OPENAI_KEY_ENCRYPTION_SECRET is required.');
  }

  const utf8 = Buffer.from(raw, 'utf8');
  if (utf8.length === 32) {
    return utf8;
  }

  const b64 = Buffer.from(raw, 'base64');
  if (b64.length === 32) {
    return b64;
  }

  throw new Error('OPENAI_KEY_ENCRYPTION_SECRET must be exactly 32 bytes (utf8 or base64).');
}

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: number;
}

export function encryptSecret(secret: string): EncryptedSecret {
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    keyVersion: KEY_VERSION
  };
}

export function decryptSecret(encrypted: EncryptedSecret): string {
  if (encrypted.keyVersion !== KEY_VERSION) {
    throw new Error(`Unsupported encryption key version: ${encrypted.keyVersion}`);
  }

  const key = getMasterKey();
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

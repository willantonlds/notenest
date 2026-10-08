import { Buffer } from 'node:buffer';

/** Normalized credentials passed to the transactional login flow. */
export type LoginCredentials = { email: string; password: string };

/** Return a safe, normalized credential pair or null for malformed input. */
export function credentials(input: unknown): LoginCredentials | null {
  if (!isRecord(input) || !hasAllowedKeys(input)) return null;
  const email = normalizeEmail(input.email);
  const password = validPassword(input.password);
  if (!email || !password) return null;
  return { email, password };
}

/** Accept only plain object bodies with the login fields. */
function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input));
}
function hasAllowedKeys(body: Record<string, unknown>): boolean {
  return Object.keys(body).every(
    (key) => key === 'email' || key === 'password',
  );
}
function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email && email.length <= 254 ? email : null;
}
function validPassword(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  return Buffer.byteLength(value, 'utf8') <= 72 ? value : null;
}

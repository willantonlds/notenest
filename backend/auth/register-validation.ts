import { Buffer } from 'node:buffer';

/** Identifies safe client-facing registration validation outcomes. */
export class RegistrationError extends Error {
  constructor(
    public code: 'invalid' | 'duplicate' | 'password' | 'password-long',
  ) {
    super(code);
  }
}
type Fields = { displayName: string; email: string; password: string };

/** Validate public fields and normalize the unique email key. */
export function validateRegistration(input: unknown): Fields {
  const { displayName, email, password } = objectInput(input);
  if (!isText(displayName) || !isText(email) || !isText(password))
    throw new RegistrationError('invalid');
  validatePassword(password);
  const name = displayName.trim();
  const address = email.trim().toLowerCase();
  if (!validName(name) || !validEmail(address))
    throw new RegistrationError('invalid');
  return { displayName: name, email: address, password };
}
function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new RegistrationError('invalid');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).some(
      (key) => !['displayName', 'email', 'password'].includes(key),
    )
  )
    throw new RegistrationError('invalid');
  return value;
}
function validatePassword(password: string): void {
  if ([...password].length < 8) throw new RegistrationError('password');
  if (Buffer.byteLength(password, 'utf8') > 72)
    throw new RegistrationError('password-long');
}
function isText(value: unknown): value is string {
  return typeof value === 'string';
}
function validName(value: string): boolean {
  return Boolean(value && value.length <= 80);
}
function validEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

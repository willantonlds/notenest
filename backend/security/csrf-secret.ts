import { randomBytes } from 'node:crypto';

const developmentSecret = randomBytes(32).toString('hex');

/** Use an explicit strong key in deployed environments and stable local key. */
export function csrfSecret(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.CSRF_SECRET ?? env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
    throw new Error(
      'CSRF_SECRET or SESSION_SECRET must contain 32 characters.',
    );
  }
  return developmentSecret;
}

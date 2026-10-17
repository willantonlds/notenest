import { afterEach, describe, expect, it } from 'vitest';
import { createSessionMiddleware, sessionCookieOptions } from './middleware';

const db = {} as Parameters<typeof createSessionMiddleware>[0];
const originalEnv = {
  node: process.env.NODE_ENV,
  secret: process.env.SESSION_SECRET,
};

afterEach(() => {
  if (originalEnv.node === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnv.node;
  if (originalEnv.secret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalEnv.secret;
});

describe('session secret policy', () => {
  it('rejects missing or short production secrets', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;
    expect(() => createSessionMiddleware(db)).toThrow(/32 characters/);
    process.env.SESSION_SECRET = 'too-short';
    expect(() => createSessionMiddleware(db)).toThrow(/32 characters/);
  });

  it('uses an ephemeral per-process secret when non-production has no secret', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SESSION_SECRET;
    expect(() => createSessionMiddleware(db)).not.toThrow();
    expect(sessionCookieOptions().secure).toBe(false);
  });

  it('accepts a sufficiently long production secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'a'.repeat(32);
    expect(() => createSessionMiddleware(db)).not.toThrow();
  });

  it('sets Secure only for production without starting a server', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-only-secret-' + 'x'.repeat(32);
    expect(() => createSessionMiddleware(db)).not.toThrow();
    expect(sessionCookieOptions().secure).toBe(true);
    process.env.NODE_ENV = 'test';
    expect(sessionCookieOptions().secure).toBe(false);
  });
});

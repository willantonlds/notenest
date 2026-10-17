import { describe, expect, it } from 'vitest';
import { csrfSecret } from './csrf-secret';

describe('CSRF key policy', () => {
  it('requires an explicit strong key in deployed environments', () => {
    expect(() => csrfSecret({ NODE_ENV: 'production' })).toThrow(
      /32 characters/,
    );
    expect(() =>
      csrfSecret({ NODE_ENV: 'staging', SESSION_SECRET: 'short' }),
    ).toThrow();
    expect(
      csrfSecret({ NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(32) }),
    ).toBe('x'.repeat(32));
  });
});

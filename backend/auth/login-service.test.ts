import { describe, expect, it } from 'vitest';
import { LoginError, login } from './login-service';

describe('login validation', () => {
  it('rejects malformed credentials and passwords over 72 UTF-8 bytes', async () => {
    const db = {
      $transaction: async () => {
        throw new Error('must not query');
      },
    } as never;
    await expect(
      login(db, { email: 'a@b.test', password: 'é'.repeat(37) }),
    ).rejects.toBeInstanceOf(LoginError);
    await expect(login(db, null)).rejects.toBeInstanceOf(LoginError);
    await expect(
      login(db, { email: 'a@b.test', password: 'ok', role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(LoginError);
  });
});

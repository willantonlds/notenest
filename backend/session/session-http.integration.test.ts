import { describe, expect, it } from 'vitest';
import {
  identity,
  login,
  request,
  useSessionFixture,
  userId,
} from './lifecycle-fixture';

/** Check persistence and express-session regeneration through real HTTP. */
describe('session HTTP persistence', () => {
  useSessionFixture();

  it('persists authentication across separate requests', async () => {
    const cookieValue = await login();
    expect(await identity(cookieValue)).toBe(userId);
    const response = await request('/test/me', {
      headers: { cookie: cookieValue },
    });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('notenest.sid');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).not.toContain('Secure');
  });

  it('regeneration invalidates the old cookie and issues a valid new one', async () => {
    const oldCookie = await login();
    const newCookie = await login(oldCookie);
    expect(await identity(oldCookie)).toBeNull();
    expect(await identity(newCookie)).toBe(userId);
  });
});

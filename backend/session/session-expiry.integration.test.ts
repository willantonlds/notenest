import { describe, expect, it } from 'vitest';
import {
  db,
  identity,
  latestSession,
  login,
  request,
  useSessionFixture,
} from './lifecycle-fixture';

/** Check idle/absolute expiration and destruction through the HTTP resolver. */
describe('session expiry and destruction', () => {
  useSessionFixture();

  it('rejects idle-expired and absolute-expired sessions', async () => {
    for (const absolute of [false, true]) {
      const cookie = await login();
      const row = await latestSession();
      const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await db.session.update({
        where: { id: row.id },
        data: absolute
          ? { createdAt: past, expiresAt: new Date(Date.now() + 60_000) }
          : { expiresAt: past },
      });
      expect(await identity(cookie)).toBeNull();
      expect(
        await db.sessionRevocation.findUnique({ where: { id: row.id } }),
      ).not.toBeNull();
    }
  });

  it('destroy removes the payload and permanently revokes its SID', async () => {
    const cookie = await login();
    const row = await latestSession();
    await request('/test/destroy', { method: 'POST', headers: { cookie } });
    expect(await db.session.findUnique({ where: { id: row.id } })).toBeNull();
    expect(
      await db.sessionRevocation.findUnique({ where: { id: row.id } }),
    ).not.toBeNull();
  });
});

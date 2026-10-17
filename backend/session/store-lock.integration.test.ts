import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PrismaSessionStore } from './store';

const db = new PrismaClient();
const store = new PrismaSessionStore(db);

/** Prove a session mutation waits on the transaction-scoped SID lock. */
describe('per-SID advisory lock', () => {
  it('blocks destroy while another transaction holds the SID lock', async () => {
    const sid = 'e06-lock-' + crypto.randomUUID();
    let signalLocked!: () => void;
    let release!: () => void;
    let finished = false;
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const holder = db.$transaction(async (tx) => {
      await tx.$queryRaw`WITH held AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtextextended(${sid}, 0))) SELECT 1 FROM held`;
      signalLocked();
      await released;
    });
    let destroyed!: Promise<void>;
    try {
      await locked;
      destroyed = new Promise<void>((resolve, reject) => {
        store.destroy(sid, (error) => {
          if (error) return reject(error);
          finished = true;
          resolve();
        });
      });
      await waitForBlockedAdvisoryQuery();
      expect(finished).toBe(false);
    } finally {
      release();
    }
    await holder;
    await destroyed!;
    expect(finished).toBe(true);
    await db.sessionRevocation.deleteMany({ where: { id: sid } });
    await db.$disconnect();
  });
});

/** Wait until PostgreSQL confirms a session transaction is blocked on a lock. */
async function waitForBlockedAdvisoryQuery(): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const rows = await db.$queryRaw<
      Array<{ blocked: bigint }>
    >`SELECT count(*) AS blocked FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE '%pg_advisory_xact_lock%'`;
    if (rows[0]?.blocked) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error('Destroy did not block on its SID advisory lock.');
}

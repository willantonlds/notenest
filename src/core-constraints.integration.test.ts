import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const userIds: string[] = [];

type OwnerFixture = { id: string; email: string };

/** Create one isolated owner row for direct PostgreSQL constraints. */
async function ownerFixture(): Promise<OwnerFixture> {
  const email = `constraints-${crypto.randomUUID()}@example.test`;
  const owner = await db.user.create({
    data: {
      displayName: 'Constraint owner',
      email,
      passwordHash: 'test-hash',
    },
  });
  userIds.push(owner.id);
  return { id: owner.id, email };
}

afterAll(async () => {
  if (userIds.length)
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe('PostgreSQL constraints', () => {
  it('rejects invalid roles and malformed email addresses', async () => {
    const owner = await ownerFixture();
    await expect(
      db.$executeRaw`UPDATE users SET role = 'OWNER' WHERE id = ${owner.id}::uuid`,
    ).rejects.toThrow();
    await expect(
      db.user.create({
        data: { displayName: 'Bad', email: 'bad email', passwordHash: 'x' },
      }),
    ).rejects.toThrow();
  });

  it('rejects duplicate email addresses at the unique index', async () => {
    const owner = await ownerFixture();
    await expect(
      db.user.create({
        data: {
          displayName: 'Duplicate',
          email: owner.email,
          passwordHash: 'x',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects notes whose owner does not exist', async () => {
    await expect(
      db.note.create({
        data: { ownerId: crypto.randomUUID(), title: 'Orphan' },
      }),
    ).rejects.toThrow();
  });
});

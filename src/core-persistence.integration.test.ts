import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const email = `fixture-${crypto.randomUUID()}@example.test`;
const moderatorEmail = `moderator-${crypto.randomUUID()}@example.test`;
let userId = '';
let moderatorId = '';
let noteId = '';
let sessionId = '';
let eventId = '';

afterAll(async () => {
  if (eventId) await db.moderationEvent.delete({ where: { id: eventId } });
  if (sessionId) await db.session.delete({ where: { id: sessionId } });
  if (noteId) await db.note.delete({ where: { id: noteId } });
  if (userId) await db.user.delete({ where: { id: userId } });
  if (moderatorId) await db.user.delete({ where: { id: moderatorId } });
  await db.$disconnect();
});

describe('PostgreSQL core persistence', () => {
  it('stores core rows, defaults, and session payloads', async () => {
    const user = await db.user.create({
      data: { displayName: 'Fixture member', email, passwordHash: 'test-hash' },
    });
    userId = user.id;
    const moderator = await db.user.create({
      data: {
        displayName: 'Fixture moderator',
        email: moderatorEmail,
        passwordHash: 'test-hash',
        role: 'MODERATOR',
      },
    });
    moderatorId = moderator.id;
    const note = await db.note.create({
      data: { ownerId: user.id, title: 'Fixture' },
    });
    noteId = note.id;
    const session = await db.session.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
        data: { opaque: ['session', 'payload'] },
      },
    });
    sessionId = session.id;
    const event = await db.moderationEvent.create({
      data: { noteId: note.id, moderatorId: moderator.id, action: 'HIDE' },
    });
    eventId = event.id;
    expect(user.role).toBe('MEMBER');
    expect(note.visibility).toBe('PRIVATE');
    expect(note.isHidden).toBe(false);
    expect(note.body).toBe('');
    expect(session.data).toEqual({ opaque: ['session', 'payload'] });
    expect(event.action).toBe('HIDE');
    await expect(
      db.note.create({
        data: { ownerId: user.id, title: 'Too long', body: 'x'.repeat(50001) },
      }),
    ).rejects.toThrow();
  });
});

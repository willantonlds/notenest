import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { resolveCurrentUser } from './current-user';
import {
  moderatorPublicNoteWhere,
  noteAccessWhere,
  publicNoteWhere,
} from './authorization';

const db = { user: { findUnique: vi.fn() } };

describe('trusted current-user resolution', () => {
  it('uses the session identity and current database role, not client fields', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
    const req = {
      session: { userId: 'u1' },
      body: { userId: 'admin', role: 'MODERATOR' },
    } as Request;
    await expect(resolveCurrentUser(req, db as never)).resolves.toEqual({
      id: 'u1',
      role: 'MEMBER',
    });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { id: true, role: true },
    });
    db.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MODERATOR' });
    await expect(resolveCurrentUser(req, db as never)).resolves.toEqual({
      id: 'u1',
      role: 'MODERATOR',
    });
  });

  it('ignores absent client identity and deleted accounts', async () => {
    db.user.findUnique.mockClear();
    const req = { session: {} } as Request;
    await expect(resolveCurrentUser(req, db as never)).resolves.toBeNull();
    expect(db.user.findUnique).not.toHaveBeenCalled();
    db.user.findUnique.mockResolvedValue(null);
    await expect(
      resolveCurrentUser(
        { session: { userId: 'gone' } } as Request,
        db as never,
      ),
    ).resolves.toBeNull();
  });
});

describe('note visibility predicates', () => {
  it('lets owners see their own notes and eligible public notes only', () => {
    expect(noteAccessWhere({ id: 'owner', role: 'MEMBER' })).toEqual({
      OR: [{ ownerId: 'owner' }, { visibility: 'PUBLIC', isHidden: false }],
    });
    expect(publicNoteWhere()).toEqual({
      visibility: 'PUBLIC',
      isHidden: false,
    });
    expect(moderatorPublicNoteWhere('n-hidden')).toEqual({
      id: 'n-hidden',
      visibility: 'PUBLIC',
    });
  });
});

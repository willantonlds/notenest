import type { NoteVisibility, Prisma } from '@prisma/client';
import type { CurrentUser } from './current-user';

/** Owners retain access to moderated private notes; others do not. */
export function noteAccessWhere(
  user: CurrentUser,
  noteId?: string,
): Prisma.NoteWhereInput {
  return {
    ...(noteId ? { id: noteId } : {}),
    OR: [
      { ownerId: user.id },
      { visibility: 'PUBLIC' as NoteVisibility, isHidden: false },
    ],
  };
}

/** Moderators may review hidden PUBLIC notes, but never PRIVATE notes. */
export function moderatorPublicNoteWhere(
  noteId?: string,
): Prisma.NoteWhereInput {
  return {
    ...(noteId ? { id: noteId } : {}),
    visibility: 'PUBLIC',
  };
}

/** Shared feed eligibility excludes every private or held note. */
export function publicNoteWhere(): Prisma.NoteWhereInput {
  return { visibility: 'PUBLIC', isHidden: false };
}

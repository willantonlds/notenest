import type { PrismaClient, UserRole } from '@prisma/client';
import type { Request } from 'express';

/** Verified identity and role loaded from the account table per request. */
export type CurrentUser = { id: string; role: UserRole };
type Db = Pick<PrismaClient, 'user'>;

/** Resolve identity only through the server-owned session user id. */
export async function resolveCurrentUser(
  req: Request,
  db: Db,
): Promise<CurrentUser | null> {
  const id = req.session.userId;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  return user ? { id: user.id, role: user.role } : null;
}

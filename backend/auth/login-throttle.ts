import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import type { LoginAccount } from './login-service';

import {
  recordFailure,
  safeAccount,
  type LoginRow,
} from './login-throttle-state';

const DUMMY_HASH =
  '$2a$12$LJ3m4ys3Lz0JxXwN7mYv0uYb2rF5pCgGf9JH6Fs2b5kQ5JZ6K/5yK';
type Tx = Prisma.TransactionClient;

/** Serialize each account attempt and durably update its lock state. */
export async function authenticate(
  tx: Tx,
  email: string,
  password: string,
): Promise<LoginAccount | null> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${email} FOR UPDATE
  `;
  const id = rows[0]?.id;
  if (!id) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  const user = await tx.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      passwordHash: true,
      loginFailures: true,
      lockedUntil: true,
    },
  });
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  return verifyLockedUser(tx, user, password);
}

/** Check the password while holding the account row lock. */
async function verifyLockedUser(
  tx: Tx,
  user: LoginRow,
  password: string,
): Promise<LoginAccount | null> {
  const now = new Date();
  const locked = Boolean(user.lockedUntil && user.lockedUntil > now);
  const failures =
    user.lockedUntil && user.lockedUntil <= now ? 0 : user.loginFailures;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (locked) return null;
  if (!valid) {
    await recordFailure(tx, user.id, failures, now);
    return null;
  }
  await tx.user.update({
    where: { id: user.id },
    data: { loginFailures: 0, lockedUntil: null },
  });
  return safeAccount(user);
}

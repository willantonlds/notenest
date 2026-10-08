import type { Prisma } from '@prisma/client';
import type { LoginAccount } from './login-service';

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
/** Stored fields needed to check and update one locked account. */
export type LoginRow = LoginAccount & {
  passwordHash: string;
  loginFailures: number;
  lockedUntil: Date | null;
};

/** Increment consecutive failures and set a temporary lock at the threshold. */
export async function recordFailure(
  tx: Prisma.TransactionClient,
  id: string,
  failures: number,
  now: Date,
): Promise<void> {
  const count = failures + 1;
  await tx.user.update({
    where: { id },
    data: {
      loginFailures: count,
      lockedUntil:
        count >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null,
    },
  });
}

/** Strip credential and throttle fields from a login response. */
export function safeAccount(user: LoginRow): LoginAccount {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
  };
}

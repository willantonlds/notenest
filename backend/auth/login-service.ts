import type { PrismaClient, UserRole } from '@prisma/client';
import { credentials, type LoginCredentials } from './login-input';
import { authenticate } from './login-throttle';

/** Generic response shared by every credential failure. */
export const LOGIN_ERROR = 'Invalid email or password.';
/** Safe account returned after successful authentication. */
export type LoginAccount = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
};
/** Generic credential failure, independent of account state. */
export class LoginError extends Error {
  constructor() {
    super(LOGIN_ERROR);
  }
}
type Db = Pick<PrismaClient, '$transaction'>;

/** Validate credentials and verify a persisted account. */
export async function login(db: Db, input: unknown): Promise<LoginAccount> {
  const value = credentials(input);
  if (!value) throw new LoginError();
  return authenticateInTransaction(db, value);
}

/** Commit account throttling changes before returning a generic rejection. */
async function authenticateInTransaction(
  db: Db,
  value: LoginCredentials,
): Promise<LoginAccount> {
  const user = await db.$transaction((tx) =>
    authenticate(tx, value.email, value.password),
  );
  if (!user) throw new LoginError();
  return user;
}

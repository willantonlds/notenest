import bcrypt from 'bcryptjs';
import { Prisma, type PrismaClient, type UserRole } from '@prisma/client';
import { RegistrationError, validateRegistration } from './register-validation';

/** Safe public account shape; credential hashes are never included. */
export type AccountDto = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
};
type Db = Pick<PrismaClient, 'user'>;

/** Validate and create an account without exposing credential fields. */
export async function register(db: Db, input: unknown): Promise<AccountDto> {
  const value = validateRegistration(input);
  const passwordHash = await bcrypt.hash(value.password, 12);
  try {
    return await db.user.create({
      data: {
        displayName: value.displayName,
        email: value.email,
        passwordHash,
        role: 'MEMBER',
      },
      select: { id: true, displayName: true, email: true, role: true },
    });
  } catch (error) {
    if (isUniqueConflict(error)) throw new RegistrationError('duplicate');
    throw error;
  }
}

/** Detect Prisma's unique-index collision without leaking database details. */
function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

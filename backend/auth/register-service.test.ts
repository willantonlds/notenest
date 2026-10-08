import { describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { register } from './register-service';
import { RegistrationError, validateRegistration } from './register-validation';
import { registrationMessage } from './register-route';

const account = {
  id: 'uuid',
  displayName: 'Ada',
  email: 'ada@example.com',
  role: 'MEMBER' as const,
};
describe('registration service', () => {
  it('normalizes email and stores a bcrypt hash, returning a safe DTO', async () => {
    const create = vi.fn(
      async (args: {
        data: { passwordHash: string; role: string; email: string };
      }) => {
        void args;
        return account;
      },
    );
    const result = await register({ user: { create } } as never, {
      displayName: ' Ada ',
      email: 'ADA@EXAMPLE.COM',
      password: 'password8',
    });
    expect(create.mock.calls[0]![0].data.passwordHash).not.toBe('password8');
    expect(create.mock.calls[0]![0].data).toMatchObject({
      role: 'MEMBER',
      email: 'ada@example.com',
    });
    expect(
      await bcrypt.compare(
        'password8',
        create.mock.calls[0]![0].data.passwordHash,
      ),
    ).toBe(true);
    expect(result).toEqual(account);
  });
  it('rejects short passwords with the exact rule', async () => {
    await expect(
      register({ user: { create: vi.fn() } } as never, {
        displayName: 'Ada',
        email: 'a@b.com',
        password: 'short',
      }),
    ).rejects.toMatchObject({ code: 'password' });
    await expect(
      register({ user: { create: vi.fn() } } as never, {
        displayName: 'Ada',
        email: 'a@b.com',
        password: '',
      }),
    ).rejects.toMatchObject({ code: 'password' });
    expect(registrationMessage(new RegistrationError('password'))).toBe(
      'Password must be at least 8 characters.',
    );
  });
  it('rejects passwords over bcrypt byte limits', async () => {
    const tooLong = {
      displayName: 'Ada',
      email: 'a@b.com',
      password: 'é'.repeat(37),
    };
    expect(() => validateRegistration(tooLong)).toThrow('password-long');
    expect(registrationMessage(new RegistrationError('password-long'))).toBe(
      'Password must be at most 72 UTF-8 bytes.',
    );
    await expect(
      register({ user: { create: vi.fn() } } as never, {
        displayName: 'Ada',
        email: 'a@b.com',
        password: 'é'.repeat(37),
      }),
    ).rejects.toMatchObject({ code: 'password-long' });
  });
  it('rejects forged role fields', async () => {
    await expect(
      register({ user: { create: vi.fn() } } as never, {
        displayName: 'Ada',
        email: 'a@b.com',
        password: 'password',
        role: 'MODERATOR',
      }),
    ).rejects.toBeInstanceOf(RegistrationError);
  });
});

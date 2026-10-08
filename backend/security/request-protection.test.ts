import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  csrfCookieOptions,
  issueCsrf,
  validWriteRequest,
} from './request-protection';

function request(
  origin: string | null,
  header: string,
  cookie: string,
): Request {
  return {
    get: (name: string) =>
      ({
        origin: origin ?? undefined,
        'x-csrf-token': header,
        cookie: cookie
          ? `notenest.csrf=${encodeURIComponent(cookie)}`
          : undefined,
      })[name.toLowerCase()],
  } as unknown as Request;
}

describe('CSRF request contract', () => {
  it('supports HttpOnly cookie round-trip and validates exact Origin', () => {
    process.env.APP_ORIGIN = 'https://notes.example';
    const res = { cookie: vi.fn(), set: vi.fn() } as unknown as Response;
    const token = issueCsrf(res, 'secret');
    expect(res.cookie).toHaveBeenCalledWith(
      'notenest.csrf',
      token,
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(
      validWriteRequest(
        request('https://notes.example', token, token),
        'secret',
      ),
    ).toBe(true);
    expect(
      validWriteRequest(
        request('https://evil.example', token, token),
        'secret',
      ),
    ).toBe(false);
    expect(validWriteRequest(request(null, token, token), 'secret')).toBe(
      false,
    );
  });

  it('rejects forged headers, absent cookies, malformed tokens, and bad signatures', () => {
    process.env.APP_ORIGIN = 'https://notes.example';
    const res = { cookie: vi.fn(), set: vi.fn() } as unknown as Response;
    const token = issueCsrf(res, 'secret');
    expect(
      validWriteRequest(
        request('https://notes.example', `${token}x`, token),
        'secret',
      ),
    ).toBe(false);
    expect(
      validWriteRequest(request('https://notes.example', token, ''), 'secret'),
    ).toBe(false);
    expect(
      validWriteRequest(
        request('https://notes.example', 'bad.token.extra', 'bad.token.extra'),
        'secret',
      ),
    ).toBe(false);
    expect(
      validWriteRequest(
        request('https://notes.example', token, token),
        'wrong-secret',
      ),
    ).toBe(false);
    expect(csrfCookieOptions().sameSite).toBe('strict');
  });
});

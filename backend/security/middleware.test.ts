import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { protectWrites, requireUser } from './middleware';

function response() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response & { status: ReturnType<typeof vi.fn> };
}

describe('request authorization middleware', () => {
  it('requires trusted identity and current role', () => {
    const res = response();
    const next = vi.fn() as NextFunction;
    requireUser('MODERATOR')({} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    const member = { currentUser: { id: 'u', role: 'MEMBER' } } as Request;
    requireUser('MODERATOR')(member, res, next);
    expect(res.status).toHaveBeenLastCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requires JSON before forwarding a write', () => {
    const req = { method: 'POST', is: () => false } as unknown as Request;
    const res = response();
    const next = vi.fn() as NextFunction;
    protectWrites('secret')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(415);
    expect(next).not.toHaveBeenCalled();
  });
});

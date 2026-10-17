import express from 'express';
import { afterAll, describe, expect, it } from 'vitest';
import { protectWrites } from './middleware';
import { issueCsrf } from './request-protection';
import { errorHandler } from '../errors';

const secret = 'http-test-secret-'.padEnd(32, 'x');
const app = express();
app.use(express.json({ limit: '64kb' }));
app.get('/api/csrf', (_req, res) => {
  const csrfToken = issueCsrf(res, secret);
  res.status(200).json({ csrfToken });
});
app.use(protectWrites(secret));
app.post('/api/write', (_req, res) => res.sendStatus(204));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('CSRF HTTP flow', () => {
  it('returns a header token and accepts cookie/header/origin round-trip', async () => {
    process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No listener');
    const base = `http://127.0.0.1:${address.port}`;
    const issued = await fetch(`${base}/api/csrf`);
    const { csrfToken } = (await issued.json()) as { csrfToken: string };
    const cookie = issued.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');
    expect(issued.headers.get('cache-control')).toBe('no-store');
    const response = await fetch(`${base}/api/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://127.0.0.1:3000',
        Cookie: cookie!.split(';')[0],
        'X-CSRF-Token': csrfToken,
      },
      body: '{}',
    });
    expect(response.status).toBe(204);
  });

  it('rejects oversized JSON with a generic error and no body echo', async () => {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No listener');
    const marker = 'private-note-marker';
    const response = await fetch(`http://127.0.0.1:${address.port}/api/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://127.0.0.1:3000',
      },
      body: JSON.stringify({ note: marker, oversized: 'x'.repeat(65 * 1024) }),
    });
    const body = await response.text();
    expect(response.status).toBe(413);
    expect(body).toBe(JSON.stringify({ error: 'Request body too large' }));
    expect(body).not.toContain(marker);
  });

  it('rejects forged, non-JSON, and malformed writes safely', async () => {
    process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No listener');
    const base = `http://127.0.0.1:${address.port}/api/write`;
    const forged = await fetch(base, {
      method: 'POST',
      headers: {
        Origin: process.env.APP_ORIGIN!,
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'bad',
        Cookie: 'notenest.csrf=bad',
      },
      body: '{}',
    });
    expect(forged.status).toBe(403);
    const nonJson = await fetch(base, {
      method: 'POST',
      headers: { Origin: process.env.APP_ORIGIN! },
      body: 'a=1',
    });
    expect(nonJson.status).toBe(415);
  });
});

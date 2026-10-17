import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const db = new PrismaClient();
const server = createApp(db).listen(0, '127.0.0.1');
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.$disconnect();
});

describe('database health endpoint', () => {
  it('reports a live PostgreSQL connection', async () => {
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing server address.');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', database: 'ok' });
  });

  it('returns JSON for unknown API routes', async () => {
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing server address.');
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/unknown`,
    );
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it('serves the built public NoteNest shell', async () => {
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing server address.');
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<title>NoteNest</title>');
  });
});

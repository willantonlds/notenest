import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  beforeAll: vi.fn(),
  afterAll: vi.fn(),
  createServer: vi.fn(),
  db: {
    user: { upsert: vi.fn(), deleteMany: vi.fn() },
    session: { deleteMany: vi.fn() },
    sessionRevocation: { deleteMany: vi.fn() },
    $disconnect: vi.fn(),
  },
  server: {
    listening: true,
    address: () => ({ port: 12345 }),
    listen: vi.fn((_: number, _host: string, ready: () => void) => ready()),
    close: vi.fn((done: (error?: Error) => void) => done()),
  },
}));
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockReturnValue(mocks.db),
}));
vi.mock('node:http', () => ({ createServer: mocks.createServer }));
vi.mock('vitest', async (load) => ({
  ...(await load<typeof import('vitest')>()),
  beforeAll: mocks.beforeAll,
  afterAll: mocks.afterAll,
}));
afterEach(() => vi.clearAllMocks());
const { db, server } = mocks;
const setup = () => mocks.beforeAll.mock.lastCall![0]();
const teardown = () => mocks.afterAll.mock.lastCall![0]();
const email = (id: string) => `session-test-${id}@example.invalid`;
async function fixture() {
  vi.resetModules();
  mocks.createServer.mockReturnValue(mocks.server);
  const value = await import('./lifecycle-fixture');
  value.useSessionFixture();
  return value;
}

it('uses a distinct email for each suite UUID', async () => {
  const first = await fixture();
  await setup();
  const second = await fixture();
  await setup();
  const emails = db.user.upsert.mock.calls.map(([arg]) => arg.create.email);
  expect(emails).toEqual([first.userId, second.userId].map(email));
  expect(new Set(emails).size).toBe(2);
});

it('cleans only owned rows after setup fails before server creation', async () => {
  const { userId } = await fixture();
  db.user.upsert.mockRejectedValueOnce(new Error('setup failed'));
  await expect(setup()).rejects.toThrow('setup failed');
  await expect(teardown()).resolves.toBeUndefined();
  expect(mocks.createServer).not.toHaveBeenCalled();
  expect(db.session.deleteMany.mock.calls).toEqual([[{ where: { userId } }]]);
  expect(db.sessionRevocation.deleteMany.mock.calls).toEqual([
    [{ where: { id: { in: [] } } }],
  ]);
  expect(db.user.deleteMany.mock.calls).toEqual([[{ where: { id: userId } }]]);
  expect(db.$disconnect).toHaveBeenCalledOnce();
});

it('still cleans rows and disconnects if closing the server fails', async () => {
  await fixture();
  await setup();
  server.close.mockImplementationOnce((done) => done(new Error('close')));
  await expect(teardown()).rejects.toThrow('close');
  expect(db.user.deleteMany).toHaveBeenCalledOnce();
  expect(db.$disconnect).toHaveBeenCalledOnce();
});

it('always disconnects when a scoped delete fails', async () => {
  await fixture();
  db.session.deleteMany.mockRejectedValueOnce(new Error('delete failed'));
  await expect(teardown()).rejects.toThrow('delete failed');
  expect(db.$disconnect).toHaveBeenCalledOnce();
});

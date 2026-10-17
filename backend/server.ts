import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { loadConfig } from './config';

/** Start the API listener and connect Prisma to the configured database. */
async function main(): Promise<void> {
  const config = loadConfig();
  const db = new PrismaClient();
  const app = createApp(db);
  const server = app.listen(config.port, config.host, () => {
    console.info(`API listening on http://${config.host}:${config.port}`);
  });
  const stop = (): void => {
    server.close(() => void db.$disconnect());
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

main().catch((error: unknown) => {
  void error;
  console.error('API failed to start.');
  process.exitCode = 1;
});

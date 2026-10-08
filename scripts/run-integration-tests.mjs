#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateTestDatabaseUrl } from './integration-test-safety.mjs';
export { validateTestDatabaseUrl };

function runIntegrationChecks() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value)
    throw new Error('Set TEST_DATABASE_URL to the isolated test database.');
  const env = { ...process.env, DATABASE_URL: validateTestDatabaseUrl(value) };
  if (process.argv[2] === '--validate-only') return;
  runCommands(env);
}

function runCommands(env) {
  const commands = [
    ['generate', '../node_modules/prisma/build/index.js', ['generate']],
    ['migrate', '../node_modules/prisma/build/index.js', ['migrate', 'deploy']],
    [
      'integration tests',
      '../node_modules/vitest/vitest.mjs',
      ['run', '--config', 'vitest.integration.config.ts'],
    ],
  ];
  for (const [label, script, args] of commands) {
    const entry = fileURLToPath(new URL(script, import.meta.url));
    const result = spawnSync(process.execPath, [entry, ...args], {
      env,
      shell: false,
      stdio: 'inherit',
    });
    if (result.error) throw new Error(`Could not start ${label}.`);
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    runIntegrationChecks();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Integration checks failed.',
    );
    process.exitCode = 1;
  }
}

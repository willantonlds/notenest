#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Validate the isolated test database URL without revealing credentials.
 * @param {string} value Environment-provided PostgreSQL connection URL.
 * @returns {string} Canonical URL for the approved notenest_test database.
 * @throws {Error} If the protocol, host, database path, or URL shape is unsafe.
 */
export function validateTestDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('TEST_DATABASE_URL must use PostgreSQL.');
  }
  const testHosts = new Set(['127.0.0.1', 'localhost', 'postgres']);
  if (!testHosts.has(url.hostname) || url.pathname !== '/notenest_test') {
    throw new Error(
      'TEST_DATABASE_URL must use local PostgreSQL and /notenest_test.',
    );
  }
  if (url.search || url.hash || value.includes('?') || value.includes('#')) {
    throw new Error('TEST_DATABASE_URL cannot include a query or fragment.');
  }
  return url.toString();
}

/** Runs only fixed project checks with the validated test database override. */
function runIntegrationChecks() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value)
    throw new Error('Set TEST_DATABASE_URL to the isolated test database.');
  const env = { ...process.env, DATABASE_URL: validateTestDatabaseUrl(value) };
  if (process.argv[2] === '--validate-only') return;
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

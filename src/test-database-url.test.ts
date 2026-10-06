import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(
  new URL('../scripts/run-integration-tests.mjs', import.meta.url),
);

/** Validates URLs through the same safe CLI boundary used by CI scripts. */
function validate(value?: string) {
  return spawnSync(process.execPath, [runner, '--validate-only'], {
    encoding: 'utf8',
    env: { ...process.env, TEST_DATABASE_URL: value },
  });
}

describe('integration database URL guard', () => {
  it('accepts only a dedicated PostgreSQL test database URL', () => {
    expect(
      validate('postgresql://u:p@127.0.0.1:55435/notenest_test').status,
    ).toBe(0);
    for (const value of [
      undefined,
      'mysql://u:p@localhost/notenest_test',
      'postgres://u:p@/notenest_test',
      'postgres://u:p@localhost/other',
      'postgres://u:p@localhost/notenest_test?sslmode=require',
      'postgres://u:p@localhost/notenest_test#fragment',
      'postgres://u:p@database.example/notenest_test',
    ]) {
      expect(validate(value).status).toBe(1);
    }
  });
});

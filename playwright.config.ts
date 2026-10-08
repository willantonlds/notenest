import { defineConfig, devices } from '@playwright/test';

/** Configure real Chromium coverage of the built public application shell. */
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'node dist/server.js',
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.integration.test.ts',
      'backend/**/*.integration.test.ts',
    ],
  },
});

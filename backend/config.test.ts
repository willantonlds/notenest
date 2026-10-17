import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('server configuration', () => {
  it('uses loopback and the default port', () => {
    expect(loadConfig({} as NodeJS.ProcessEnv)).toEqual({
      host: '127.0.0.1',
      port: 3000,
    });
  });
  it('rejects invalid ports', () => {
    expect(() => loadConfig({ PORT: 'bad' } as NodeJS.ProcessEnv)).toThrow();
  });
});

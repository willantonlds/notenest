/** Validated runtime settings shared by the HTTP server. */
export type Config = { host: string; port: number };

/** Read explicit, safe-to-bind server settings from the environment. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const value = env.PORT ?? '3000';
  const port = parsePort(value);
  return { host: env.HOST ?? '127.0.0.1', port };
}

/** Parse a valid TCP listener port. */
function parsePort(value: string): number {
  if (!/^\d+$/.test(value)) throw new Error('PORT must be an integer.');
  const port = Number(value);
  if (port < 1 || port > 65535)
    throw new Error('PORT must be from 1 to 65535.');
  return port;
}

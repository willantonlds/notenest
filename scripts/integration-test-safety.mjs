const hosts = new Set(['127.0.0.1', 'localhost', 'postgres']);

/** Validate an isolated test database URL without revealing credentials. */
export function validateTestDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }
  validateUrlShape(url, value);
  return url.toString();
}

/** Reject unsafe protocols, hosts, paths, and URL options. */
function validateUrlShape(url, value) {
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('TEST_DATABASE_URL must use PostgreSQL.');
  }
  validateDatabaseTarget(url);
  if (url.search || url.hash || value.includes('?') || value.includes('#')) {
    throw new Error('TEST_DATABASE_URL cannot include a query or fragment.');
  }
}

/** Limit integration runs to the approved local notenest_test database. */
function validateDatabaseTarget(url) {
  if (!hosts.has(url.hostname) || url.pathname !== '/notenest_test') {
    throw new Error(
      'TEST_DATABASE_URL must use local PostgreSQL and /notenest_test.',
    );
  }
}

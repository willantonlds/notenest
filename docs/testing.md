# Testing

NoteNest is test-driven: tests are written first and prove each behavior.

## Layers
1. Unit: services and pure helpers (validation, note rules, role checks). Proves business rules in isolation.
2. Integration: routes against a test Postgres database (register, log in, note CRUD, share, hide). Proves the route, service, and data layers work together.
3. Acceptance (planned for Sprint 2): a post-deploy smoke suite against the live URL (health, sign up, log in, create note, share, moderate). Proves the deployed system works end to end.

## Frameworks
Vitest for unit and integration. Playwright covers the built public shell and health endpoint in Chromium. Full acceptance flows remain planned for Sprint 2.

## Running
`pnpm test` runs unit tests without a database. `make verify` runs all quality, build, PostgreSQL integration, and Chromium smoke gates; set `TEST_DATABASE_URL` to an isolated PostgreSQL database named `notenest_test`. To run integration tests alone, build first because the smoke test serves the built public shell, then run `pnpm run test:integration`. The command validates the URL, applies migrations, and preserves fixture data. See [operations](operations.md) for CI.

## Coverage
Cover every service and route with meaningful behavior tests. A change is not done until its tests pass in CI.

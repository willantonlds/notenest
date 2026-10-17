# Testing

NoteNest is test-driven: tests are written first and prove each behavior.

## Layers
1. Unit: services and pure helpers (validation, note rules, role checks). Proves business rules in isolation.
2. Integration: routes against a test Postgres database (register, log in, note CRUD, share, hide). Proves the route, service, and data layers work together.
3. Acceptance (planned for Sprint 2): a post-deploy smoke suite against the live URL (health, sign up, log in, create note, share, moderate). Proves the deployed system works end to end.

## Frameworks
Vitest for unit and integration. Playwright for acceptance (planned for Sprint 2).

## Running
`pnpm test` runs unit tests without a database. Set `TEST_DATABASE_URL` to an isolated PostgreSQL database named `notenest_test` and run `pnpm run test:integration`. The command validates the URL, applies migrations, and runs database tests without deleting fixture data. See [operations](operations.md) for CI.

## Coverage
Cover every service and route with meaningful behavior tests. A change is not done until its tests pass in CI.

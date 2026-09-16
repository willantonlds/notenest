# Testing

NoteNest is test-driven: tests are written first and prove each behavior.

## Layers
1. Unit: services and pure helpers (validation, note rules, role checks). Proves business rules in isolation.
2. Integration: routes against a test Postgres database (register, log in, note CRUD, share, hide). Proves the route, service, and data layers work together.
3. Acceptance (planned for Sprint 2): a post-deploy smoke suite against the live URL (health, sign up, log in, create note, share, moderate). Proves the deployed system works end to end.

## Frameworks
Vitest for unit and integration. Playwright for acceptance (planned for Sprint 2).

## Running
`make verify` runs lint, type check, and the unit and integration tests. See [operations](operations.md) for the full command set and CI.

## Coverage
Cover every service and route with meaningful behavior tests. A change is not done until its tests pass in CI.

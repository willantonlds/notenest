# NoteNest

A notetaking web app for university students. Members write notes and share them to a public study feed; Moderators keep the feed clean.

## For graders: start here
- [Grader tour](docs/for-graders.md): where each graded item lives.
- [Product](docs/product.md) . [Architecture](docs/architecture.md) . [Process and board](docs/process.md)

## For contributors
- [Contributing](CONTRIBUTING.md) . [Code standards](docs/code-standards.md) . [Testing](docs/testing.md) . [Operations](docs/operations.md)

## Stack
React and TypeScript front end, Node and Express API, Prisma over PostgreSQL, tested with Vitest, built with Docker, deployed to Fly.io. Details in [architecture](docs/architecture.md).

## Quickstart
Requires Docker and pnpm (through corepack).

```
corepack enable
make up        # start the app and Postgres in Docker
make verify    # lint, type check, unit and integration tests
```

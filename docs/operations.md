# Operations

How to run, test, ship, and deploy NoteNest. The same steps run locally, in CI, and in Docker, because each stage is one script that every caller invokes; only environment variables differ.

## Local development
Requires Docker and pnpm (through corepack).
```
corepack enable
make up        # start the app and Postgres in Docker
make verify    # source quality, PostgreSQL, unit, and Chromium checks
make down      # stop the stack
```

`make verify` requires `TEST_DATABASE_URL` to target an isolated local PostgreSQL database named `notenest_test`. It runs the shared build, integration, and Chromium checks used by CI. To run only integration tests, set the same URL and run `pnpm run build && pnpm run test:integration`.

## Stage scripts (one behavior everywhere)
- `scripts/verify.sh`: lint, format, type, unit, PostgreSQL integration, and Chromium smoke. Requires dedicated `TEST_DATABASE_URL`.
- `scripts/check-pr.sh "<title>" "<body>"`: validate the pull request or commit title and body.
- `scripts/deploy.sh`: `flyctl deploy` (build, then release migrate). Needs Fly auth.
- `scripts/acceptance.sh "<url>"`: post-deploy smoke suite against a URL.
Make and CI call the shared verification script. Make, pnpm, and Docker call the shared build script; environment variables supply database and server settings.

## Postgres (one knob: DATABASE_URL, same major version everywhere)
- Local and CI: a Postgres container (docker compose locally, a service in CI).
- Production: Fly Postgres, attached with `flyctl postgres attach`, which sets `DATABASE_URL` as a secret.
- Reach the real Fly database from your shell with `flyctl proxy 5432 -a notenest-db`.

## CI/CD workflows (thin wrappers over the scripts)
- `ci.yml`: the required `Lint, type-check, test` job uses Node from `.nvmrc`, provisions PostgreSQL, installs Chromium, and runs `scripts/verify.sh`. Pull request and push triggers remain limited to `master`.
- `deploy.yml` (push to master): runs `deploy.sh`.
- `qa.yml` (after a successful deploy): runs `acceptance.sh` against the deployed URL.

## Fly.io and secrets
The one source of the deploy token is Fly: `flyctl tokens create deploy -a notenest`.
- CI: store it once with `gh secret set FLY_API_TOKEN`. GitHub secrets are write-only; the value cannot be read back, so `.env` is never derived from the repo secret.
- Local: run `flyctl auth login` once (flyctl keeps its own credential), so `deploy.sh` works with no token in `.env`. If you prefer a token for local runs, put `FLY_API_TOKEN` in `.env` (which is gitignored).
- `.env.example` lists every variable (`DATABASE_URL`, `SESSION_SECRET`, `PORT`); nothing secret is committed.

## Stand up a new repo
Install the Probot Settings app so `settings.yml` applies the repo settings, branch protection, labels, and milestones. Push the code, run `bash scripts/setup-hooks.sh`, then configure the board and its workflows in the UI (see [process](process.md)).

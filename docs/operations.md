# Operations

How to run, test, ship, and deploy NoteNest. The same steps run locally, in CI, and in Docker, because each stage is one script that every caller invokes; only environment variables differ.

## Local development
Requires Docker and pnpm (through corepack).
```
corepack enable
make up        # start the app and Postgres in Docker
make verify    # lint, type check, unit and integration tests
make down      # stop the stack
```

## Stage scripts (one behavior everywhere)
- `scripts/verify.sh`: lint, type check, unit and integration tests. Needs `DATABASE_URL`.
- `scripts/check-pr.sh "<title>" "<body>"`: validate the pull request or commit title and body.
- `scripts/deploy.sh`: `flyctl deploy` (build, then release migrate). Needs Fly auth.
- `scripts/acceptance.sh "<url>"`: post-deploy smoke suite against a URL.
Shell, CI, and the Dockerfile all call these, so nothing reimplements the steps.

## Postgres (one knob: DATABASE_URL, same major version everywhere)
- Local and CI: a Postgres container (docker compose locally, a service in CI).
- Production: Fly Postgres, attached with `flyctl postgres attach`, which sets `DATABASE_URL` as a secret.
- Reach the real Fly database from your shell with `flyctl proxy 5432 -a notenest-db`.

## CI/CD workflows (thin wrappers over the scripts)
- `ci.yml` (pull request): Node from `.nvmrc` + pnpm + a Postgres service; runs `check-pr.sh` then `verify.sh`, plus a separate build-only Docker job.
- `deploy.yml` (push to master): runs `deploy.sh`.
- `qa.yml` (after a successful deploy): runs `acceptance.sh` against the deployed URL.

## Fly.io and secrets
The one source of the deploy token is Fly: `flyctl tokens create deploy -a notenest`.
- CI: store it once with `gh secret set FLY_API_TOKEN`. GitHub secrets are write-only; the value cannot be read back, so `.env` is never derived from the repo secret.
- Local: run `flyctl auth login` once (flyctl keeps its own credential), so `deploy.sh` works with no token in `.env`. If you prefer a token for local runs, put `FLY_API_TOKEN` in `.env` (which is gitignored).
- `.env.example` lists every variable (`DATABASE_URL`, `SESSION_SECRET`, `PORT`); nothing secret is committed.

## Two repositories
Work is developed in the private repo, and the reviewed result is published to the public class repo.

## Stand up a new repo
Install the Probot Settings app so `settings.yml` applies the repo settings, branch protection, labels, and milestones. Push the code, run `bash scripts/setup-hooks.sh`, then configure the board and its workflows in the UI (see [process](process.md)).

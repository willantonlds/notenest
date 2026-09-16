# Contributing

How to work in this repo. Code rules live in [code standards](docs/code-standards.md); this file does not restate them.

## Setup
See the [README](README.md) quickstart. In short: `make up` starts the app and Postgres in Docker, and `make verify` runs the checks.

## Branches and commits
- Branch from `master`: `feature/short-title` (or `fix/`, `redo/`, `docs/`, `chore/`).
- One branch and one pull request per issue.
- Commit subject: `<type>: <summary>`, imperative, 50 characters or fewer, no trailing period. Types: feat, fix, redo, docs, test, chore, perf, vuls.
- Commit body (optional, may be long): explain the why and reference the issue, for example `Refs #12` or `Closes #12`. Push with `git commit -m "<subject>" -m "<body>"`. The commit-msg hook enforces this.

## Pull requests
- Open a pull request into `master` and fill the template.
- CI must be green. Move the card to Dev Review (PR); see [process](docs/process.md) for the stages.

## Definition of Done
A change is done only when:
- Tests are written first and pass.
- The code meets the [code standards](docs/code-standards.md).
- Lint, type check, and CI are green.
- The pull request template is complete, and the change is reviewed and approved before merge.
- After Sprint 2, the deploy and acceptance checks pass.

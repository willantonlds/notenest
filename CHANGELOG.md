# Changelog

One entry per issue, pull request, and released version. Newest first.

## Unreleased

### Issue #28 | chore | Extend application quality and CI gates

- Add shared source-format, length, complexity, strict type, unit, PostgreSQL integration, and real Chromium checks.
- Provision a CI PostgreSQL service and use shared build and verification scripts.
- Browser checks cover only the accessible responsive public shell and health endpoint; no authentication or feature flow is included.

### Issue #27 | feat | Enforce request and access protection

- Resolve the current account role from PostgreSQL and enforce owner/public visibility predicates.
- Add signed CSRF tokens, exact-Origin JSON write checks, and a 64 KB body limit.
- Return generic internal errors without logging request or session contents.

### Issue #26 | feat | Persist PostgreSQL sessions

- Persist session lifecycle with bounded idle and absolute expiry.
- Serialize SID changes and prevent stale writes from restoring revoked sessions.
- Isolate lifecycle fixture email addresses and release resources after
  setup or cleanup failures.

### Issue #25 | feat | Bootstrap app and API shell

- Add the responsive public React shell and Express database health endpoint.

### Issue #24 | feat | Add core PostgreSQL persistence

- Add PostgreSQL-backed Prisma models, constraints, migrations, indexes, and isolated database verification.
- Generate Prisma Client explicitly before CI checks, including cached installs.

### Issue #23 | docs | Review Sprint 1 work scope

- Record the approved 14-PBI Week 1 selection, estimates, prerequisites, and
  acceptance limits without replacing existing product or architecture decisions.

## Versioning

Pre-1.0 semantic versioning, `v<major>.<minor>.<patch>`:

- Major (`0`): initial development; breaking changes allowed. A major bump means a breaking change that needs a migration.
- Minor: a completed milestone. `v0.1.0` when v0.1 Core is done, `v0.2.0` when v0.2 Sharing is done, `v0.3.0` when v0.3 Organization is done.
- Patch: each merged pull request while working toward the next milestone (`v0.0.1`, `v0.0.2`, ...).

Header format: `## YYYY-MM-DD | v<x.y.z> | PR #<n> | <type> | <title>`.

## 2026-09-14 | v0.0.1 | PR #000 | chore | Bootstrap repository governance and project plan

- Created the repository, protected `master`, and set up the project board with the Kanban, Backlog, and Roadmap views.
- Added the product backlog as issues, the Sprint iteration field, and the milestones (v0.1 Core, v0.2 Sharing, v0.3 Organization).
- Added governance: settings.yml, the pull request template, git hooks, CONTRIBUTING, and the code standards.

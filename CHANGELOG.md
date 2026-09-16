# Changelog

One entry per issue, pull request, and released version. Newest first.

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

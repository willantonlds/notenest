# For Graders

A fast tour of where each graded item lives. Doc links are relative, so they work in any fork.

## Product and plan
- [Product](product.md): scope, user types, requirements, milestones.
- [Architecture](architecture.md): stack, data model, boundaries.
- [Process and board](process.md): Scrum, sprints, board, labels, milestones.

## Evidence in the repo, not just docs
- Requirements: the product backlog on the Issues tab, grouped by area label and milestone.
- Sprints and progress: the Projects tab, the NoteNest Project Board (Kanban, Backlog, Roadmap).
- Work history: pull requests, each tied to an issue, with checks on the Actions tab.
- Quality gates: the [CI workflow](../.github/workflows/ci.yml) and branch protection on master.
- Code standards: [code standards](code-standards.md), enforced by ESLint and the git hooks.
- Releases: [CHANGELOG](../CHANGELOG.md).

## Assignment mapping
- Two user types, a dynamic database, frontend to backend to database, one central database: [architecture](architecture.md) and [product](product.md).
- Agile with Scrum, two sprints, three presentations: [process](process.md).

# Process and Board

NoteNest uses Scrum: two build sprints, each ending in a demo, bracketed by three presentation weeks.

## Timeline
The Sprint field on the board is a GitHub iteration field with five entries:
- Presentation 1: Sep 28 to Oct 2 (proposal and plan).
- Sprint 1: Oct 5 to 23 (build iteration 1).
- Presentation 2: Oct 26 to 30 (Sprint 1 demo).
- Sprint 2: Nov 2 to 20 (build iteration 2).
- Presentation 3: Nov 30 to Dec 4 (final demo).
Each story has a sprint (when it is built) and a milestone (what value it delivers). Presentation weeks are tracked as issues #20, #21, and #22.

## The board (NoteNest Project Board)
Three views:
- Kanban (Standups): the daily board, grouped by status.
- Backlog (Grooming): a table of every story, for refinement.
- Roadmap: a timeline by sprint, using the Start date and Target date fields.

## Status columns
Blocked, Todo, In Progress, Dev Review (PR), Merged (Deployment), QA Review (Post Merge/Deploy), Done, Won't Do.

## Issues, labels, milestones
- Each user story is an issue; the issue number is the ticket ID. Commits and pull requests reference it (for example, Closes #12).
- Labels (17):
  - Story tracking: story, task.
  - Area (epics): area:access, area:notes, area:share, area:moderation.
  - Change type (matches the commit types): feat, fix, redo, docs, test, chore, perf, vuls.
  - Milestone event: presentation.
  - Housekeeping: bug, enhancement.
- Milestones are the value versions: v0.1 Core, v0.2 Sharing, v0.3 Organization. Each story is assigned to the version it delivers.

## Ceremonies
- Grooming: refine and estimate stories in the Backlog view.
- Sprint planning: pull stories into a sprint.
- Daily check: move cards on the Kanban view.
- Review and retrospective: at the end of each sprint.

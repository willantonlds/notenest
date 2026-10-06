# Week 1 PBI review

## Purpose and inputs

This review applies the approved first-week selection to the existing 19-story,
72-PBI backlog. It does not replace the product, architecture, process, or code
standards documents. Existing decisions remain authoritative unless a future
review explicitly records a change.

Week 1 covers 14 ranked PBIs with 40 proposed relative points. The approved work
window is five weekdays with two project hours per day. Points are estimates, not
hours or a claim that the selected work fits the available time. Testing and
review use the same project capacity.

## Selected work

| Rank | PBI   | Points | Owner role | Prerequisites     | Review note                                                              |
| ---: | :---- | -----: | :--------- | :---------------- | :----------------------------------------------------------------------- |
|    1 | E01   |      2 | Product    | None              | Record reviewed scope, assumptions, dependencies, and estimates.         |
|    2 | E02   |      5 | Backend    | E01               | Add PostgreSQL persistence and repeatable isolated fixtures.             |
|    3 | E05   |      3 | Frontend   | E01               | Add React/Vite and Express entry points, shared shell, and health check. |
|    4 | E06   |      3 | Backend    | E02, E05          | Persist, resolve, expire, regenerate, and destroy server sessions.       |
|    5 | E03   |      5 | Backend    | E02, E05, E06     | Resolve current roles and enforce request and ownership controls.        |
|    6 | E04   |      3 | Backend    | E02               | Extend the existing quality checks with database and browser coverage.   |
|    7 | S01-A |      3 | Backend    | E03               | Validate registration and persist only password hashes.                  |
|    8 | S01-B |      2 | Frontend   | S01-A             | Add registration form feedback and own-list navigation intent.           |
|    9 | S02-A |      3 | Backend    | S01-A             | Authenticate credentials through the shared session lifecycle.           |
|   10 | S02-B |      2 | Frontend   | S02-A             | Add login and safe expired-session feedback.                             |
|   11 | S02-C |      3 | Backend    | S02-A, S02-B, E04 | Verify throttling, regeneration, expiry, and persistence.                |
|   12 | S03-A |      2 | Backend    | S02-A             | Revoke only the current session and prevent private caching.             |
|   13 | S03-B |      2 | Frontend   | S03-A             | Add logout and guard restored private browser history.                   |
|   14 | S03-C |      2 | Backend    | S03-A, S03-B, E04 | Verify logout and isolation of another active device.                    |

## Existing decisions retained

- Keep the documented React, Express, Prisma, and PostgreSQL architecture and
  its frontend, route, service, and data-layer boundaries.
- Keep server-side cookie sessions and bcrypt. Do not replace them with JWT or
  microservices.
- Read each protected request's user and role from trusted server-side data.
  Registration creates a MEMBER account; clients cannot choose a role.
- Keep private-note ownership and moderator privacy rules. This week does not
  implement note CRUD, sharing, tags, courses, or moderation behavior.
- Preserve the documented session limits, input bounds, CSRF/Origin safeguards,
  and generic credential errors. Resolve details through the existing product
  and architecture documents rather than duplicating or silently changing them.
- Preserve the existing Node, pnpm, lint, format, type-check, and Vitest setup.
  Add only the application and PostgreSQL commands needed by the selected work.

## Limits and unresolved acceptance

The submitted backlog makes registration's final empty-note-list check depend on
S06-B. Note CRUD is outside this Week 1 selection, so registration, login, and
logout PRs must not claim full story completion when the real notes interface or
its acceptance checks are still absent. Record those criteria as pending.

The owner holds Product, Scrum Master, Frontend, and Backend responsibilities.
The proposed points are one person's reviewed planning estimates, not votes or
measured velocity. Revisit the forecast when implementation evidence changes it.

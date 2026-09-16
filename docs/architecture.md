# Architecture

Many browsers reach one central backend that owns the database. This defines the stack, data model, boundaries, and topology.

## Stack
- Front end: React and TypeScript (Vite).
- Back end: Node, Express, and TypeScript.
- Data: Prisma over PostgreSQL.
- Auth: HTTP-only cookie sessions, bcrypt password hashes, role checks.
- Build and run: Docker; deployed to Fly.io.

## Data model
Entities: User, Note, Tag, NoteTag, Course. Fields and relations live in the source of truth, `prisma/schema.prisma`. In short: a User owns Notes; a Note can be public and may be hidden by a Moderator; Notes carry Tags and an optional Course; a User has a role, MEMBER or MODERATOR.

## Module boundaries
```
frontend/   pages, components, API client (no business rules, no DB)
backend/    routes (validate, check role), services (business rules)
prisma/     schema and migrations
docs/       documentation
```
Dependency direction: `frontend -> routes -> services -> data access -> database`. Only the data access layer talks to the database; the frontend never reaches it directly.

## Central database
The app uses one central PostgreSQL database. Prisma selects it with `DATABASE_URL`, so every machine reaches the same data. Local development and CI use a Postgres container; production uses Fly Postgres. See [operations](operations.md).

## Runtime flow
1. A visitor registers or logs in; the backend creates a session and checks the role on every protected request.
2. A member creates, edits, deletes, tags, searches, and groups notes.
3. A member publishes a note to the public feed.
4. A moderator hides or restores a public note.

# NoteNest

A simple, focused note-taking web app for university students.

Course project for CEN3031 (Intro to Software Engineering), Fall 2026.

## Planned features
- Sign up / log in with two user roles: **Member** and **Moderator**
- Create, edit, and delete personal notes
- Tag and search notes
- Share notes to a public feed; moderators can hide inappropriate public notes

## Tech stack
- Frontend: React + TypeScript (Vite)
- Backend: Node.js + Express + TypeScript
- Database: SQLite (development)

## Engineering standards
- Test-driven development (Vitest); SOLID design
- Files <= 100 lines; 80-column formatting; cyclomatic complexity <= 6
- CI (GitHub Actions): lint + type-check + tests on every pull request

## License
MIT

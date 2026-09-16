# Code Standards

Rules for all code in this repo. CONTRIBUTING references this file; the numbers live only here.

## Size and complexity
- Files target 80 lines and must stay at or under 100. ESLint warns over 80; the git hooks and CI block over 100.
- Functions target cyclomatic complexity 5 and must stay at or under 6. Over 6 is blocked by ESLint.
- Lines wrap at 80 columns.
- One responsibility per file (SOLID).

## TypeScript
- Strict mode. No implicit any. Explicit return types on exported functions.

## Formatting and linting
- Prettier owns formatting; run it, do not hand-format.
- ESLint enforces the size, complexity, and correctness rules.

## Naming
- Files: kebab-case (`note-card.ts`). React components: PascalCase file and export (`NoteCard.tsx`).
- Variables and functions: camelCase. Types, interfaces, classes: PascalCase. Constants: UPPER_SNAKE_CASE.
- Tests: `<name>.test.ts` beside the source.

## Comments
- Explain why, not what. Do not comment self-evident code.
- Keep comments accurate; update them when behavior changes. Do not remove a useful comment without replacing it with equal or better information.
- Use JSDoc on exported functions and types.

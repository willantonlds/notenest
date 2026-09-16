#!/bin/bash
# NoteNest : check-style.sh
# Purpose: run local lint, format check, type check, and file length check.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running ESLint..."
pnpm run lint

echo "Checking formatting with Prettier..."
pnpm exec prettier --check .

echo "Running the TypeScript type check..."
pnpm run typecheck

echo "Checking file lengths..."
bash scripts/check-file-length.sh

echo "Style checks completed successfully."

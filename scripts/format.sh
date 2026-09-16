#!/bin/bash
# NoteNest : format.sh
# Purpose: format all files with Prettier.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

pnpm exec prettier --write .
echo "Formatting complete."

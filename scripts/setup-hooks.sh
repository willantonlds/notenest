#!/bin/bash
# NoteNest : setup-hooks.sh
# Purpose: enable the repository local Git hook directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push .githooks/commit-msg

echo "Git hooks configured to use .githooks/."
echo "pre-commit, pre-push, and commit-msg protections are now active."

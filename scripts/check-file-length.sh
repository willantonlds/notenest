#!/bin/bash
# NoteNest : check-file-length.sh
# Purpose: warn on source files over 80 lines and block files over 100 lines.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

WARN=80
LIMIT=100
fail=0

files=$(git ls-files | grep -E '^src/.*\.(ts|tsx)$' || true)

for f in $files; do
    [ -f "$f" ] || continue
    n=$(wc -l < "$f")
    if [ "$n" -gt "$LIMIT" ]; then
        echo "BLOCK: $f has $n lines (hard limit $LIMIT)."
        fail=1
    elif [ "$n" -gt "$WARN" ]; then
        echo "warn:  $f has $n lines (target $WARN, hard limit $LIMIT)."
    fi
done

if [ "$fail" -ne 0 ]; then
    echo "File length check failed: split files over $LIMIT lines before you continue."
    exit 1
fi

echo "File length check passed."

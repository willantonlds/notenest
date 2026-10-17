#!/usr/bin/env bash
# Warn over 80 lines and block supported source files over 100 lines.
set -euo pipefail
cd "$(dirname "$0")/.."
find src backend frontend scripts tests -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.css' -o -name '*.html' -o -name '*.sh' \) -print0 2>/dev/null | while IFS= read -r -d '' file; do
  count=$(wc -l < "$file")
  if (( count > 100 )); then echo "error: $file has $count lines (limit 100)."; exit 1; fi
  if (( count > 80 )); then echo "warn: $file has $count lines (target 80, limit 100)."; fi
done
echo "File length check passed."

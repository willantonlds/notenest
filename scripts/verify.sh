#!/usr/bin/env bash
# Run all quality, database, and real-browser verification gates.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
: "${TEST_DATABASE_URL:?Set TEST_DATABASE_URL to an isolated local notenest_test PostgreSQL database.}"
export DATABASE_URL="$TEST_DATABASE_URL" HOST=127.0.0.1
corepack pnpm run lint
corepack pnpm run typecheck
bash scripts/check-file-length.sh
corepack pnpm run format
corepack pnpm test
bash scripts/build.sh
corepack pnpm run test:integration
corepack pnpm exec playwright install chromium
PORT=4173 SESSION_SECRET='E04-browser-test-secret-which-is-long-enough' APP_ORIGIN='http://127.0.0.1:4173' corepack pnpm run test:browser

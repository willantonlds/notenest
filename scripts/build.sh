#!/usr/bin/env bash
# Build generated Prisma client, browser assets, typed modules, and server bundle.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
corepack pnpm exec prisma generate
corepack pnpm exec vite build
corepack pnpm exec tsc -p backend/tsconfig.json
corepack pnpm exec tsc -p frontend/tsconfig.json
corepack pnpm exec esbuild backend/server.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/server.js

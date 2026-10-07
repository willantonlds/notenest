.PHONY: up down verify

up:
	docker compose up --build -d

down:
	docker compose down

verify:
	corepack pnpm run lint
	corepack pnpm run typecheck
	corepack pnpm test

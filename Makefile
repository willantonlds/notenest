.PHONY: up down build verify

up:
	docker compose up --build -d

down:
	docker compose down

build:
	bash scripts/build.sh

verify:
	bash scripts/verify.sh

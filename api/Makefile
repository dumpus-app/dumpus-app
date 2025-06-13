.ONESHELL:
.PHONY: up down install dev

include .env

up:
	docker compose up --build -d
	docker compose logs -f

down:
	docker compose down

install:
	. .venv/bin/activate
	uv pip install -r requirements.txt
	uv run ./scripts/download-ntk.py

dev:
	. .venv/bin/activate
	bash -c " \
		trap 'docker compose down' EXIT; \
		docker compose up -d broker db worker && \
		cd src && \
		waitress-serve --port=${API_PORT} app:app \
	"
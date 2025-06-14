.ONESHELL:
.PHONY: up down install dev

include .env

up:
	docker compose up --build -d
	docker compose logs -f

down:
	docker compose down

install:
	uv venv --python 3.10
	. .venv/bin/activate
	uv pip install -r requirements.txt
	uv run ./scripts/download-ntk.py

dev:
	. .venv/bin/activate
	bash -c " \
		trap 'docker compose down' EXIT; \
		docker compose up -d broker db && \
		cd src && \
		tee \
			>(docker compose logs -f) \
			>(celery --app tasks worker --loglevel=info --queues=${CELERY_QUEUE} --hostname=${CELERY_HOSTNAME}@%h --concurrency=1) \
			>(waitress-serve --port=${API_PORT} app:app) \
	"
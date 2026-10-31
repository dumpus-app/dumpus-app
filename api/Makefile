.ONESHELL:
.PHONY: up down install dev test

-include .env

up:
	docker compose up --build -d
	docker compose logs -f

down:
	docker compose down

install:
	uv venv --python 3.14
	. .venv/bin/activate
	uv pip install -r requirements.txt

dev:
	. .venv/bin/activate
	bash -c " \
		trap 'docker compose down' EXIT; \
		docker compose up -d db && \
		cd src && \
		QUEUE_BACKEND=sync waitress-serve --port=${API_PORT} app:app \
	"

# Brings up a throwaway Postgres for the run and removes it after. Extra pytest
# arguments go in ARGS, for eg. `make test ARGS="-k golden"`. Each line stands
# alone: the GNU Make 3.81 macOS ships ignores `.ONESHELL`. The worker runs
# dumpus-processor, built from `processor/` with the flags of `Dockerfile.worker`.
test:
	set -e
	[ -d .venv ] || uv venv --python 3.14
	uv pip install --quiet --python .venv/bin/python -r requirements-test.txt
	if command -v npm > /dev/null && [ ! -d tests/client/node_modules ]; then npm ci --prefix tests/client; fi
	CGO_ENABLED=0 go -C ../processor build -trimpath -buildvcs=false -o "$(CURDIR)/.bin/dumpus-processor" ./cmd/dumpus-processor
	DUMPUS_PROCESSOR="$(CURDIR)/.bin/dumpus-processor" .venv/bin/python -m pytest $(ARGS)

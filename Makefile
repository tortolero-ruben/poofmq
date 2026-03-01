.PHONY: infra-up infra-down bootstrap portal-dev full-stack proto-generate proto-deps proto-check-generated

BUF_VERSION ?= 1.53.0
BUF_IMAGE ?= bufbuild/buf:$(BUF_VERSION)
BUF_DOCKER_RUN = docker run --rm --user "$$(id -u):$$(id -g)" -e XDG_CACHE_HOME=/workspace/.cache -e BUF_CACHE_DIR=/workspace/.cache/buf -v "$(CURDIR)":/workspace -w /workspace $(BUF_IMAGE)

infra-up:
	docker compose up -d redis postgres

infra-down:
	docker compose down

bootstrap:
	cp -n .env.example .env || true
	composer install
	npm install
	docker compose up -d redis postgres
	php artisan key:generate --force
	php artisan migrate --force

portal-dev:
	composer run dev

full-stack:
	docker compose up -d
	composer run dev

proto-generate:
	$(BUF_DOCKER_RUN) generate

proto-deps:
	$(BUF_DOCKER_RUN) dep update

proto-check-generated:
	$(MAKE) proto-generate
	git diff --exit-code -- buf.lock gen/go gen/openapi

.PHONY: infra-up infra-down bootstrap portal-dev full-stack \
	ci-lint-laravel ci-lint-frontend ci-lint-go ci-test-laravel ci-test-go \
	proto-generate proto-deps proto-check-generated generate-artifacts ci-check-generated \
	setup-hooks

BUF_VERSION ?= 1.53.0
BUF_IMAGE ?= bufbuild/buf:$(BUF_VERSION)
BUF_DOCKER_RUN = docker run --rm --user "$$(id -u):$$(id -g)" -e XDG_CACHE_HOME=/tmp/xdg-cache -e BUF_CACHE_DIR=/tmp/buf-cache -v "$(CURDIR)":/workspace -w /workspace $(BUF_IMAGE)

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

ci-lint-laravel:
	composer lint:check

ci-lint-frontend:
	npm run format:check
	npm run lint:check

ci-lint-go:
	@cd services/go-api && files=$$(gofmt -l .); \
	if [ -n "$$files" ]; then \
		echo "Files need formatting:"; \
		echo "$$files"; \
		exit 1; \
	fi
	cd services/go-api && go vet ./...

ci-test-laravel:
	php artisan test --compact

ci-test-go:
	cd services/go-api && go test ./...

proto-generate:
	$(BUF_DOCKER_RUN) generate

proto-deps:
	$(BUF_DOCKER_RUN) dep update

proto-check-generated:
	$(MAKE) proto-generate
	git diff --exit-code -- buf.lock gen/go gen/openapi
	test -z "$$(git ls-files --others --exclude-standard -- buf.lock gen/go gen/openapi)"

generate-artifacts:
	./scripts/generate-artifacts.sh

ci-check-generated:
	./scripts/check-generated-artifacts.sh

setup-hooks:
	@echo "Setting up git hooks..."
	@cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✓ Pre-commit hook installed. Go vet/test will run before commits."

.PHONY: infra-up infra-down bootstrap portal-dev full-stack \
	ci-lint-laravel ci-lint-frontend ci-lint-go ci-test-laravel ci-test-go \
	ci-test-go-unit ci-test-go-integration \
	proto-generate proto-deps proto-check-generated generate-artifacts ci-check-generated \
	openapi-publish sdk-generate setup-hooks \
	railway-add-redis railway-add-databases railway-set-worker-cron-vars

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
	$(MAKE) ci-test-go-unit
	$(MAKE) ci-test-go-integration

ci-test-go-unit:
	cd services/go-api && go test ./... -skip TestClientIntegration

ci-test-go-integration:
	cd services/go-api && go test ./internal/queue -run TestClientIntegration -count=1

proto-generate:
	$(BUF_DOCKER_RUN) generate

proto-deps:
	$(BUF_DOCKER_RUN) dep update

proto-check-generated:
	$(MAKE) proto-generate
	./scripts/inject-openapi-version.sh
	$(MAKE) openapi-publish
	git diff --exit-code -- buf.lock gen/go gen/openapi dist/openapi
	test -z "$$(git ls-files --others --exclude-standard -- buf.lock gen/go gen/openapi dist/openapi)"

generate-artifacts:
	./scripts/generate-artifacts.sh

openapi-publish:
	@mkdir -p dist/openapi/v1
	@cp gen/openapi/poofmq.swagger.json dist/openapi/v1/poofmq.json
	@echo "Published OpenAPI artifact to dist/openapi/v1/poofmq.json"

sdk-generate:
	./scripts/sdk-generate.sh

ci-check-generated:
	./scripts/check-generated-artifacts.sh

setup-hooks:
	@echo "Setting up git hooks..."
	@hooks_dir="$$(git rev-parse --git-path hooks)"; \
	cp scripts/git-hooks/pre-commit "$$hooks_dir/pre-commit"; \
	chmod +x "$$hooks_dir/pre-commit"
	@echo "✓ Pre-commit hook installed. Frontend and Go checks will run before commits."

railway-add-redis:
	chmod +x railway/add-redis.sh && ./railway/add-redis.sh

railway-add-databases:
	chmod +x railway/add-redis.sh && ./railway/add-redis.sh --postgres

railway-set-worker-cron-vars:
	chmod +x railway/set-worker-cron-variables.sh && ./railway/set-worker-cron-variables.sh

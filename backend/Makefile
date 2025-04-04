.PHONY: build run test lint migrate fix-imports

# Переменные
APP_NAME=moshosp
BUILD_DIR=./bin
MAIN=./cmd/api/main.go

# Команды для сборки и запуска
build:
	@echo "Building $(APP_NAME)..."
	go build -o $(BUILD_DIR)/$(APP_NAME) $(MAIN)
	@echo "Build completed: $(BUILD_DIR)/$(APP_NAME)"

run:
	@echo "Running $(APP_NAME)..."
	go run $(MAIN)

# Команды для тестирования
test:
	@echo "Running tests..."
	go test -v ./...

lint:
	@echo "Running linter..."
	golangci-lint run

# Команды для миграций
migrate-up:
	@echo "Running migrations up..."
	./scripts/migrate.sh up

migrate-down:
	@echo "Rolling back last migration..."
	./scripts/migrate.sh down

migrate-create:
	@echo "Creating new migration..."
	@read -p "Enter migration name: " name; \
	./scripts/migrate.sh create $$name

# Команды для исправления импортов
fix-imports:
	@echo "Fixing imports..."
	@echo "This will replace 'github.com/kalin/moshosp/backend' with 'moshosp/backend'"
	@read -p "Are you sure? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		bash ./scripts/fix_imports.sh "github.com/kalin/moshosp/backend" "moshosp/backend"; \
		go mod tidy; \
	else \
		echo "Operation cancelled"; \
	fi

# Задача по умолчанию (запускается при вызове make без аргументов)
default: build

# Помощь
help:
	@echo "Available commands:"
	@echo "  make build         - Build the application"
	@echo "  make run           - Run the application"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linter"
	@echo "  make migrate-up    - Apply migrations"
	@echo "  make migrate-down  - Roll back last migration"
	@echo "  make migrate-create - Create new migration"
	@echo "  make fix-imports   - Fix import paths"
	@echo "  make help          - Show this help" 
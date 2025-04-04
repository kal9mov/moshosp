#!/bin/bash
set -e

# Проверка наличия migrate
if ! [ -x "$(command -v migrate)" ]; then
  echo 'Error: migrate is not installed.' >&2
  echo 'Install with: go install -tags "postgres" github.com/golang-migrate/migrate/v4/cmd/migrate@latest' >&2
  exit 1
fi

# Загрузка переменных окружения
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Значения по умолчанию
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-moshosp}

# Формирование DSN
DB_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"

# Операция: up, down, create
OPERATION=$1
VERSION=$2
NAME=$3

# Путь к миграциям
MIGRATIONS_PATH="./database/migrations"

case $OPERATION in
  up)
    echo "Running migrations up..."
    migrate -path ${MIGRATIONS_PATH} -database "${DB_URL}" up
    ;;
  down)
    echo "Running migrations down..."
    migrate -path ${MIGRATIONS_PATH} -database "${DB_URL}" down 1
    ;;
  create)
    if [ -z "$NAME" ]; then
      echo "Error: Migration name is required for create operation"
      echo "Usage: $0 create <name>"
      exit 1
    fi
    echo "Creating new migration: $NAME"
    migrate create -ext sql -dir ${MIGRATIONS_PATH} -seq $NAME
    ;;
  reset)
    echo "Resetting database..."
    migrate -path ${MIGRATIONS_PATH} -database "${DB_URL}" drop
    migrate -path ${MIGRATIONS_PATH} -database "${DB_URL}" up
    ;;
  version)
    echo "Checking migration version..."
    migrate -path ${MIGRATIONS_PATH} -database "${DB_URL}" version
    ;;
  *)
    echo "Usage: $0 {up|down|create|reset|version} [name]"
    exit 1
    ;;
esac

echo "Migration operation $OPERATION completed" 
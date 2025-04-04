#!/bin/bash
set -e

# Проверка параметров
echo "Этот скрипт исправит все пути импорта в проекте"
echo "Будет выполнена замена 'moshosp/backend' на 'github.com/kalin/moshosp/backend'"
echo "Заменить все импорты? (y/n)"
read -r confirm

if [ "$confirm" != "y" ]; then
  echo "Операция отменена"
  exit 0
fi

echo "Исправляю импорты..."

# Поиск всех .go файлов и замена строк
find . -type f -name "*.go" -exec sed -i 's|"moshosp/backend/|"github.com/kalin/moshosp/backend/|g' {} \;

echo "Импорты исправлены"
echo "Теперь выполните 'go mod tidy' для обновления зависимостей" 
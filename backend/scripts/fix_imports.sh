#!/bin/bash
set -e

# Проверка аргументов
if [ $# -ne 2 ]; then
  echo "Usage: $0 <old_import_prefix> <new_import_prefix>"
  echo "Example: $0 \"github.com/kalin/moshosp/backend\" \"moshosp/backend\""
  exit 1
fi

OLD_PREFIX=$1
NEW_PREFIX=$2

echo "Replacing imports from $OLD_PREFIX to $NEW_PREFIX"

# Находим все go файлы
GO_FILES=$(find . -type f -name "*.go")

# Заменяем импорты в каждом файле
for file in $GO_FILES; do
  echo "Processing $file"
  # Используем sed для замены импортов
  sed -i "s|\"$OLD_PREFIX|\"$NEW_PREFIX|g" "$file"
done

echo "Import replacement completed. Run 'go mod tidy' to update dependencies." 
# MosHosp

Платформа для помощи нуждающимся.

## Структура проекта

```
moshosp/
├── backend/        # Серверная часть на Go
├── frontend/       # Клиентская часть
├── database/       # Миграции и SQL-скрипты
├── docker/         # Docker-конфигурации
└── docs/           # Документация
```

## Исправление проблем с Go модулями

В проекте наблюдаются ошибки, связанные с несоответствием путей импорта и названия модуля:
- В файлах используются импорты вида `moshosp/backend/...`
- При этом модуль в go.mod называется либо `moshosp`, либо `moshosp/backend`
- Код также может содержать импорты вида `github.com/kalin/moshosp/backend/...`

### Решение проблемы с модулями:

1. Клонировать репозиторий:
   ```
   git clone https://github.com/kalin/moshosp.git
   cd moshosp
   ```

2. Установите правильные имена модулей в go.mod:
   ```
   # В файле moshosp/go.mod:
   module github.com/kalin/moshosp

   # В файле moshosp/backend/go.mod:
   module github.com/kalin/moshosp/backend
   ```

3. Исправьте все импорты:
   ```
   # Windows (PowerShell):
   Get-ChildItem -Recurse -Filter *.go | ForEach-Object {
     (Get-Content $_.FullName) -replace '"moshosp/backend/', '"github.com/kalin/moshosp/backend/' | Set-Content $_.FullName
   }

   # Linux/Mac:
   find . -type f -name "*.go" -exec sed -i 's|"moshosp/backend/|"github.com/kalin/moshosp/backend/|g' {} \;
   ```

4. Обновите зависимости:
   ```
   cd backend
   go mod tidy
   ```

5. Убедитесь, что компиляция прошла успешно:
   ```
   cd backend
   go build ./cmd/api
   ```

### Альтернативное решение (для локальной разработки)

Если вы не хотите использовать путь GitHub и предпочитаете локальные модули:

1. Установите локальное имя модуля:
   ```
   # В файле moshosp/backend/go.mod:
   module moshosp/backend
   ```

2. Создайте файл go.work:
   ```
   cd moshosp
   go work init
   go work use ./backend
   ```

3. Исправьте импорты на локальные:
   ```
   # Windows (PowerShell):
   Get-ChildItem -Recurse -Filter *.go | ForEach-Object {
     (Get-Content $_.FullName) -replace '"github.com/kalin/moshosp/backend/', '"moshosp/backend/' | Set-Content $_.FullName
   }

   # Linux/Mac:
   find . -type f -name "*.go" -exec sed -i 's|"github.com/kalin/moshosp/backend/|"moshosp/backend/|g' {} \;
   ```

4. Обновите зависимости:
   ```
   cd backend
   go mod tidy
   ```

## Запуск проекта

После исправления модулей:

1. Настройте .env файл:
   ```
   cp backend/.env.example backend/.env
   # Отредактируйте .env файл
   ```

2. Запустите базу данных:
   ```
   docker-compose up -d postgres
   ```

3. Примените миграции:
   ```
   cd backend
   ./scripts/migrate.sh up
   ```

4. Запустите бэкенд:
   ```
   cd backend
   go run cmd/api/main.go
   ```

5. Запустите фронтенд:
   ```
   cd frontend
   npm install
   npm run dev
   ``` 
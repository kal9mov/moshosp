# MosHosp Backend API

Бэкенд приложения MosHosp для помощи нуждающимся.

## Технический стек

- Go 1.21+
- PostgreSQL 14+
- Chi Router
- SQLX
- JWT аутентификация
- Docker и Docker Compose

## Структура проекта

```
backend/
├── cmd/
│   └── api/
│       └── main.go           # Точка входа в приложение
├── database/
│   └── migrations/           # SQL миграции для базы данных
├── internal/
│   ├── config/               # Конфигурация приложения
│   ├── domain/               # Модели предметной области
│   │   └── models/
│   ├── handlers/             # HTTP обработчики запросов
│   ├── middleware/           # Промежуточные обработчики
│   ├── repository/           # Репозитории для работы с БД
│   ├── services/             # Бизнес-логика
│   └── utils/                # Вспомогательные утилиты
├── scripts/                  # Скрипты для разработки и деплоя
├── .env.example              # Пример файла с переменными окружения
├── Dockerfile                # Файл для сборки Docker образа
├── go.mod                    # Зависимости Go
└── go.sum                    # Хеши зависимостей Go
```

## Решение проблем с модулями

### Проблемы с импортами

Если вы видите ошибки линтера, связанные с импортами, скорее всего, имеется несоответствие имени модуля в импортах. Есть два возможных решения:

1. **Изменить имя модуля в go.mod**:
   ```
   module moshosp/backend
   ```

2. **Исправить импорты во всех файлах**:
   Используйте скрипт fix_imports.sh для автоматического исправления:
   ```
   make fix-imports
   ```
   Этот скрипт заменяет все импорты `github.com/kalin/moshosp/backend` на `moshosp/backend`.

### Общие проблемы с зависимостями

Если вы столкнулись с проблемами зависимостей, выполните:
```
go mod tidy
```

## Запуск приложения

### Локальная разработка

1. Клонируйте репозиторий
2. Создайте файл `.env` на основе `.env.example`
3. Запустите PostgreSQL
4. Запустите миграции:
   ```
   make migrate-up
   ```
   или
   ```
   ./scripts/migrate.sh up
   ```
5. Запустите приложение:
   ```
   make run
   ```
   или
   ```
   go run cmd/api/main.go
   ```

### Запуск в Docker

1. Создайте файл `.env` на основе `.env.example`
2. Соберите и запустите контейнеры:
   ```
   docker-compose up -d
   ```

## Миграции базы данных

- Создание новой миграции:
  ```
  make migrate-create
  ```
  или
  ```
  ./scripts/migrate.sh create <name>
  ```

- Применение миграций:
  ```
  make migrate-up
  ```
  или
  ```
  ./scripts/migrate.sh up
  ```

- Откат последней миграции:
  ```
  make migrate-down
  ```
  или
  ```
  ./scripts/migrate.sh down
  ```

## API эндпоинты

### Авторизация

- `POST /api/auth/login` - Авторизация пользователя
- `POST /api/auth/telegram` - Авторизация через Telegram
- `POST /api/auth/refresh` - Обновление JWT токена

### Запросы о помощи

- `GET /api/requests` - Получение списка запросов
- `GET /api/requests/{id}` - Получение информации о запросе
- `POST /api/requests` - Создание нового запроса
- `PUT /api/requests/{id}` - Обновление запроса
- `DELETE /api/requests/{id}` - Удаление запроса
- `POST /api/requests/{id}/take` - Взятие запроса волонтером
- `POST /api/requests/{id}/complete` - Завершение запроса
- `POST /api/requests/{id}/cancel` - Отмена запроса
- `POST /api/requests/{id}/comments` - Добавление комментария
- `GET /api/requests/{id}/comments` - Получение комментариев
- `POST /api/requests/{id}/rate` - Оценка выполненного запроса

### Пользователи

- `GET /api/users/me` - Получение профиля пользователя
- `PUT /api/users/me` - Обновление профиля пользователя
- `GET /api/users/me/requests` - Запросы пользователя
- `GET /api/users/me/volunteer-requests` - Запросы волонтера

### Геймификация

- `GET /api/game/me` - Получение информации о прогрессе пользователя
- `GET /api/game/achievements` - Получение всех достижений
- `GET /api/game/me/achievements` - Получение достижений пользователя
- `GET /api/game/leaderboard` - Получение таблицы лидеров
- `POST /api/game/me/notifications/mark-read` - Отметить уведомления как прочитанные

## Тестовые данные

Бэкенд содержит готовые миграции с тестовыми данными:
- 5 пользователей с разными ролями
- Несколько готовых запросов
- Комментарии и оценки
- Достижения и уведомления 
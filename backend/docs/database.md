# Структура базы данных MosHosp

## Основные таблицы

### users
Хранит информацию о пользователях системы.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| telegram_id | BIGINT | ID пользователя в Telegram (уникальный) |
| name | VARCHAR(100) | Имя пользователя |
| phone | VARCHAR(20) | Номер телефона |
| email | VARCHAR(100) | Email |
| avatar_url | TEXT | URL аватара |
| role | VARCHAR(20) | Роль (user, volunteer, admin) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### user_stats
Статистика пользователей для геймификации.

| Поле | Тип | Описание |
|------|-----|----------|
| user_id | INT | ID пользователя (FK -> users.id) |
| experience | INT | Опыт |
| level | INT | Уровень |
| completed_requests | INT | Количество выполненных запросов |
| volunteer_hours | INT | Часы волонтерства |
| achievements_count | INT | Количество достижений |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### user_tokens
Хранит токены обновления для пользователей.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| user_id | INT | ID пользователя (FK -> users.id) |
| refresh_token | VARCHAR(255) | Токен обновления |
| expired_at | TIMESTAMP | Срок действия токена |
| created_at | TIMESTAMP | Дата создания |

### user_devices
Устройства пользователей для push-уведомлений.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| user_id | INT | ID пользователя (FK -> users.id) |
| device_token | VARCHAR(255) | Токен устройства |
| device_type | VARCHAR(20) | Тип устройства |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

## Запросы о помощи

### categories
Категории запросов о помощи.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| name | VARCHAR(100) | Название категории |
| icon | VARCHAR(100) | Иконка |
| created_at | TIMESTAMP | Дата создания |

### requests
Запросы о помощи.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| title | VARCHAR(200) | Заголовок |
| description | TEXT | Описание |
| location | VARCHAR(255) | Местоположение |
| category_id | INT | ID категории (FK -> categories.id) |
| priority | VARCHAR(20) | Приоритет (low, medium, high) |
| status | VARCHAR(20) | Статус (new, in_progress, completed, cancelled) |
| author_id | INT | ID автора (FK -> users.id) |
| volunteer_id | INT | ID волонтера (FK -> users.id) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### request_comments
Комментарии к запросам.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| request_id | INT | ID запроса (FK -> requests.id) |
| user_id | INT | ID пользователя (FK -> users.id) |
| text | TEXT | Текст комментария |
| created_at | TIMESTAMP | Дата создания |

### request_ratings
Оценки выполненных запросов.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| request_id | INT | ID запроса (FK -> requests.id) |
| user_id | INT | ID пользователя (FK -> users.id) |
| rating | INT | Оценка (1-5) |
| feedback | TEXT | Отзыв |
| created_at | TIMESTAMP | Дата создания |

## Геймификация

### achievement_categories
Категории достижений.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| name | VARCHAR(100) | Название категории |
| icon | VARCHAR(100) | Иконка |
| created_at | TIMESTAMP | Дата создания |

### achievements
Достижения.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| code | VARCHAR(50) | Код достижения (уникальный) |
| name | VARCHAR(100) | Название |
| description | TEXT | Описание |
| icon | VARCHAR(100) | Иконка |
| category_id | INT | ID категории (FK -> achievement_categories.id) |
| rarity | VARCHAR(20) | Редкость (common, rare, epic, legendary) |
| experience | INT | Опыт за получение |
| created_at | TIMESTAMP | Дата создания |

### user_achievements
Достижения пользователей.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| user_id | INT | ID пользователя (FK -> users.id) |
| achievement_id | INT | ID достижения (FK -> achievements.id) |
| unlocked_at | TIMESTAMP | Дата получения |

### notifications
Уведомления.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор (PK) |
| user_id | INT | ID пользователя (FK -> users.id) |
| title | VARCHAR(100) | Заголовок |
| message | TEXT | Сообщение |
| type | VARCHAR(50) | Тип уведомления |
| is_read | BOOLEAN | Прочитано ли |
| data | JSONB | Дополнительные данные |
| created_at | TIMESTAMP | Дата создания |

## Схема связей

```
users ---< user_stats
users ---< user_tokens
users ---< user_devices
users ---< requests (author)
users ---< requests (volunteer)
users ---< request_comments
users ---< request_ratings
users ---< user_achievements
users ---< notifications

categories ---< requests

requests ---< request_comments
requests ---< request_ratings

achievement_categories ---< achievements
achievements ---< user_achievements
``` 
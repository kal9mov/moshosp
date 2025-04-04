-- Удаление тестовых уведомлений
DELETE FROM notifications WHERE user_id IN (1, 2, 3, 4, 5);

-- Удаление достижений пользователей
DELETE FROM user_achievements WHERE user_id IN (1, 2, 3, 4, 5);

-- Удаление тестовых оценок
DELETE FROM request_ratings WHERE request_id IN (3, 4);

-- Удаление тестовых комментариев
DELETE FROM request_comments WHERE request_id IN (2, 3, 4);

-- Удаление тестовых запросов
DELETE FROM requests WHERE id IN (1, 2, 3, 4, 5);

-- Удаление статистики пользователей
DELETE FROM user_stats WHERE user_id IN (1, 2, 3, 4, 5);

-- Удаление тестовых пользователей
DELETE FROM users WHERE telegram_id IN (123456789, 987654321, 111222333, 444555666, 777888999); 
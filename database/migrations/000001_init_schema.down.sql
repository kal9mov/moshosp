-- Удаление индексов
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_user_achievements_user_id;
DROP INDEX IF EXISTS idx_request_comments_request_id;
DROP INDEX IF EXISTS idx_requests_category_id;
DROP INDEX IF EXISTS idx_requests_status;
DROP INDEX IF EXISTS idx_requests_volunteer_id;
DROP INDEX IF EXISTS idx_requests_author_id;
DROP INDEX IF EXISTS idx_users_telegram_id;

-- Удаление таблиц
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS achievement_categories;
DROP TABLE IF EXISTS request_ratings;
DROP TABLE IF EXISTS request_comments;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_devices;
DROP TABLE IF EXISTS user_tokens;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS users; 
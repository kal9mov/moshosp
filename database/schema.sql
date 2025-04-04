-- Основная схема базы данных для проекта MOSHOSP
-- Включает таблицы для пользователей, заявок, волонтёров, достижений и статистики

-- Создание базы данных (если не существует)
CREATE DATABASE IF NOT EXISTS moshosp;

-- Переключение на базу данных
\c moshosp;

-- Создание расширения для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание перечислений (enum)
CREATE TYPE user_role AS ENUM ('user', 'volunteer', 'admin');
CREATE TYPE request_status AS ENUM ('new', 'in_progress', 'completed', 'cancelled');
CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE notification_type AS ENUM (
  'request_created',
  'request_assigned',
  'request_completed',
  'request_cancelled',
  'achievement_unlocked',
  'level_up',
  'system'
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(50) UNIQUE,
  username VARCHAR(50),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50),
  photo_url TEXT,
  phone VARCHAR(20),
  address TEXT,
  about TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица статистики пользователей
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  completed_requests INTEGER NOT NULL DEFAULT 0,
  created_requests INTEGER NOT NULL DEFAULT 0,
  volunteer_hours INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Таблица категорий запросов
CREATE TABLE IF NOT EXISTS request_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица запросов о помощи
CREATE TABLE IF NOT EXISTS help_requests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status request_status NOT NULL DEFAULT 'new',
  category_id INTEGER REFERENCES request_categories(id),
  priority request_priority NOT NULL DEFAULT 'medium',
  location TEXT,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Таблица комментариев к запросам
CREATE TABLE IF NOT EXISTS request_comments (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица оценок выполненных запросов
CREATE TABLE IF NOT EXISTS request_ratings (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  rater_id INTEGER NOT NULL REFERENCES users(id),
  rated_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_id, rater_id, rated_id)
);

-- Таблица для достижений
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  icon_src TEXT,
  category VARCHAR(50) NOT NULL,
  rarity_level VARCHAR(20) NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для связи пользователей и достижений
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  progress_current INTEGER,
  progress_total INTEGER,
  unlock_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Таблица игровых данных пользователя
CREATE TABLE IF NOT EXISTS user_game_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  completed_quests INTEGER NOT NULL DEFAULT 0,
  total_quests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Таблица уведомлений пользователей
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT,
  request_id INTEGER REFERENCES help_requests(id) ON DELETE SET NULL,
  achievement_id VARCHAR(50) REFERENCES achievements(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица партнёрских организаций
CREATE TABLE IF NOT EXISTS partner_organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Триггер для автоматического обновления даты изменения
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применение триггера ко всем таблицам с полем updated_at
CREATE TRIGGER update_users_modtime
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_user_stats_modtime
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_request_categories_modtime
  BEFORE UPDATE ON request_categories
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_help_requests_modtime
  BEFORE UPDATE ON help_requests
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_request_comments_modtime
  BEFORE UPDATE ON request_comments
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_achievements_modtime
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_user_achievements_modtime
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_user_game_data_modtime
  BEFORE UPDATE ON user_game_data
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_partner_organizations_modtime
  BEFORE UPDATE ON partner_organizations
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_requester ON help_requests(requester_id);
CREATE INDEX idx_help_requests_volunteer ON help_requests(assigned_to);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- Создание представления для основных данных пользователя
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id, 
  u.username, 
  u.first_name, 
  u.last_name, 
  u.photo_url, 
  u.role, 
  us.level, 
  us.experience, 
  us.completed_requests, 
  us.created_requests
FROM users u
JOIN user_stats us ON u.id = us.user_id;

-- Создание представления для лидерборда
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id, 
  u.username, 
  u.first_name, 
  u.last_name, 
  u.photo_url, 
  us.level, 
  us.experience AS points, 
  us.completed_requests,
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id AND ua.unlocked = TRUE) AS achievements_count
FROM users u
JOIN user_stats us ON u.id = us.user_id
WHERE us.level > 0 OR us.experience > 0 OR us.completed_requests > 0
ORDER BY us.level DESC, us.experience DESC;

-- Создание полнотекстового поиска для запросов о помощи
ALTER TABLE help_requests ADD COLUMN fts_document tsvector;

CREATE OR REPLACE FUNCTION help_requests_trigger() RETURNS trigger AS $$
BEGIN
  NEW.fts_document := 
     setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
     setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B') ||
     setweight(to_tsvector('russian', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER help_requests_update_trigger
  BEFORE INSERT OR UPDATE ON help_requests
  FOR EACH ROW EXECUTE PROCEDURE help_requests_trigger();

CREATE INDEX help_requests_fts_idx ON help_requests USING GIN (fts_document);

-- Функция для поиска запросов помощи
CREATE OR REPLACE FUNCTION search_help_requests(search_query TEXT)
RETURNS SETOF help_requests AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM help_requests
  WHERE fts_document @@ plainto_tsquery('russian', search_query)
  ORDER BY ts_rank(fts_document, plainto_tsquery('russian', search_query)) DESC;
END
$$ LANGUAGE plpgsql;

-- Добавляем дополнительные поля для мягкого удаления
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE help_requests ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE; 
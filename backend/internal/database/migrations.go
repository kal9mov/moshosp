package database

import (
	"github.com/jmoiron/sqlx"
)

// MigrateDB применяет миграции к базе данных
func MigrateDB(db *sqlx.DB) error {
	// SQL для создания таблиц
	createTablesSQL := `
	-- Таблица пользователей
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		telegram_id TEXT UNIQUE NOT NULL,
		username TEXT,
		first_name TEXT,
		last_name TEXT,
		photo_url TEXT,
		role TEXT NOT NULL DEFAULT 'user',
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP NOT NULL DEFAULT NOW()
	);

	-- Таблица запросов о помощи
	CREATE TABLE IF NOT EXISTS help_requests (
		id SERIAL PRIMARY KEY,
		title TEXT NOT NULL,
		description TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'new',
		category TEXT NOT NULL,
		priority TEXT NOT NULL DEFAULT 'medium',
		requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		assigned_to INTEGER REFERENCES users(id),
		location TEXT,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
		completed_at TIMESTAMP
	);

	-- Таблица достижений
	CREATE TABLE IF NOT EXISTS achievements (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT NOT NULL,
		icon TEXT NOT NULL,
		category TEXT NOT NULL,
		points INTEGER NOT NULL DEFAULT 0,
		rarity TEXT NOT NULL DEFAULT 'common',
		created_at TIMESTAMP NOT NULL DEFAULT NOW()
	);

	-- Таблица пользовательских достижений
	CREATE TABLE IF NOT EXISTS user_achievements (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
		unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
		UNIQUE (user_id, achievement_id)
	);

	-- Таблица статистики пользователей
	CREATE TABLE IF NOT EXISTS user_stats (
		id SERIAL PRIMARY KEY,
		user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		level INTEGER NOT NULL DEFAULT 1,
		experience INTEGER NOT NULL DEFAULT 0,
		completed_requests INTEGER NOT NULL DEFAULT 0,
		created_requests INTEGER NOT NULL DEFAULT 0,
		volunteer_hours INTEGER NOT NULL DEFAULT 0,
		rating DECIMAL(3,2) DEFAULT 5.0,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP NOT NULL DEFAULT NOW()
	);

	-- Индексы для оптимизации запросов
	CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
	CREATE INDEX IF NOT EXISTS idx_help_requests_category ON help_requests(category);
	CREATE INDEX IF NOT EXISTS idx_help_requests_requester ON help_requests(requester_id);
	CREATE INDEX IF NOT EXISTS idx_help_requests_assigned ON help_requests(assigned_to);
	CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
	CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level);
	CREATE INDEX IF NOT EXISTS idx_user_stats_experience ON user_stats(experience);
	`

	// Выполняем миграции
	_, err := db.Exec(createTablesSQL)
	return err
}

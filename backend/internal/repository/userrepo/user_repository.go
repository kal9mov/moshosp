package userrepo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository"

	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

// CreateUser создает нового пользователя
func (r *UserRepository) CreateUser(ctx context.Context, user *models.User) (*models.User, error) {
	query := `
		INSERT INTO users (
			telegram_id, username, first_name, last_name, photo_url, phone, address, about, role
		) VALUES (
			:telegram_id, :username, :first_name, :last_name, :photo_url, :phone, :address, :about, :role
		) RETURNING id, telegram_id, username, first_name, last_name, photo_url, phone, address, about, role, created_at, updated_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("no rows returned after user creation")
	}

	var createdUser models.User
	if err := rows.StructScan(&createdUser); err != nil {
		return nil, fmt.Errorf("failed to scan created user: %w", err)
	}

	return &createdUser, nil
}

// GetUserByID получает пользователя по ID
func (r *UserRepository) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, telegram_id, username, first_name, last_name, photo_url, phone, address, about, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return &user, nil
}

// GetUserByTelegramID получает пользователя по Telegram ID
func (r *UserRepository) GetUserByTelegramID(ctx context.Context, telegramID int64) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, telegram_id, username, first_name, last_name, photo_url, phone, address, about, role, created_at, updated_at
		FROM users
		WHERE telegram_id = $1
	`

	err := r.db.GetContext(ctx, &user, query, telegramID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user by Telegram ID: %w", err)
	}

	return &user, nil
}

// UpdateUser обновляет информацию о пользователе
func (r *UserRepository) UpdateUser(ctx context.Context, user *models.User) (*models.User, error) {
	user.UpdatedAt = time.Now()
	query := `
		UPDATE users
		SET username = :username,
			first_name = :first_name,
			last_name = :last_name,
			photo_url = :photo_url,
			phone = :phone,
			address = :address,
			about = :about,
			role = :role,
			updated_at = :updated_at
		WHERE id = :id
		RETURNING id, telegram_id, username, first_name, last_name, photo_url, phone, address, about, role, created_at, updated_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, user)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, repository.ErrNotFound
	}

	var updatedUser models.User
	if err := rows.StructScan(&updatedUser); err != nil {
		return nil, fmt.Errorf("failed to scan updated user: %w", err)
	}

	return &updatedUser, nil
}

// UpdateUserProfile обновляет профиль пользователя
func (r *UserRepository) UpdateUserProfile(ctx context.Context, userID int, profile *models.UserProfileUpdate) (*models.User, error) {
	query := `
		UPDATE users
		SET phone = COALESCE($1, phone),
			address = COALESCE($2, address),
			about = COALESCE($3, about),
			updated_at = NOW()
		WHERE id = $4
		RETURNING id, telegram_id, username, first_name, last_name, photo_url, phone, address, about, role, created_at, updated_at
	`

	var user models.User
	err := r.db.GetContext(
		ctx,
		&user,
		query,
		profileValueOrNull(profile.Phone),
		profileValueOrNull(profile.Address),
		profileValueOrNull(profile.About),
		userID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	return &user, nil
}

// GetUserFullInfo получает полную информацию о пользователе
func (r *UserRepository) GetUserFullInfo(ctx context.Context, userID int) (*models.UserFullInfo, error) {
	// Запрос пользователя
	user, err := r.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Запрос статистики
	var stats models.UserStats
	statsQuery := `
		SELECT 
			u.id,
			COALESCE(g.level, 1) as level,
			COALESCE(g.experience, 0) as experience,
			COALESCE(completed.count, 0) as completed_requests,
			COALESCE(vol_hours.hours, 0) as volunteer_hours
		FROM users u
		LEFT JOIN user_game_data g ON u.id = g.user_id
		LEFT JOIN (
			SELECT requester_id, COUNT(*) as count
			FROM help_requests
			WHERE status = 'completed'
			GROUP BY requester_id
		) completed ON u.id = completed.requester_id
		LEFT JOIN (
			SELECT assigned_user_id, SUM(EXTRACT(EPOCH FROM (completed_at - updated_at))/3600) as hours
			FROM help_requests
			WHERE status = 'completed' AND assigned_user_id IS NOT NULL
			GROUP BY assigned_user_id
		) vol_hours ON u.id = vol_hours.assigned_user_id
		WHERE u.id = $1
	`

	err = r.db.GetContext(ctx, &stats, statsQuery, userID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}

	// Формирование полной информации
	userInfo := &models.UserFullInfo{
		User:  *user,
		Stats: stats,
	}

	return userInfo, nil
}

// GetLeaderboard получает список пользователей для таблицы лидеров
func (r *UserRepository) GetLeaderboard(ctx context.Context, limit, offset int) ([]models.LeaderboardUser, error) {
	query := `
		SELECT 
			ROW_NUMBER() OVER (ORDER BY g.experience DESC) as rank,
			u.id,
			u.telegram_id,
			u.username,
			u.first_name,
			u.last_name,
			u.photo_url,
			g.level,
			g.experience as points,
			COALESCE(completed.count, 0) as completed_requests,
			COALESCE(vol_tasks.count, 0) as volunteer_tasks
		FROM users u
		INNER JOIN user_game_data g ON u.id = g.user_id
		LEFT JOIN (
			SELECT requester_id, COUNT(*) as count
			FROM help_requests
			WHERE status = 'completed'
			GROUP BY requester_id
		) completed ON u.id = completed.requester_id
		LEFT JOIN (
			SELECT assigned_user_id, COUNT(*) as count
			FROM help_requests
			WHERE status = 'completed' AND assigned_user_id IS NOT NULL
			GROUP BY assigned_user_id
		) vol_tasks ON u.id = vol_tasks.assigned_user_id
		ORDER BY g.experience DESC
		LIMIT $1 OFFSET $2
	`

	var users []models.LeaderboardUser
	err := r.db.SelectContext(ctx, &users, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	return users, nil
}

// profileValueOrNull возвращает SQL-представление nullable-значения
func profileValueOrNull(value *string) interface{} {
	if value == nil {
		return nil
	}
	return *value
}

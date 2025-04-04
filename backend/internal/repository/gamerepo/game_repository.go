package gamerepo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"time"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository"

	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
)

type GameRepository struct {
	db     *sqlx.DB
	logger *logrus.Logger
}

func NewGameRepository(db *sqlx.DB, logger *logrus.Logger) *GameRepository {
	return &GameRepository{
		db:     db,
		logger: logger,
	}
}

// GetUserGameData получает игровые данные пользователя
func (r *GameRepository) GetUserGameData(ctx context.Context, userID int) (*models.UserGameData, error) {
	var gameData models.UserGameData
	query := `
		SELECT id, user_id, level, experience, completed_quests, total_quests, created_at, updated_at
		FROM user_game_data 
		WHERE user_id = $1
	`

	err := r.db.GetContext(ctx, &gameData, query, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Если игровых данных нет, создаем их
			return r.createInitialGameData(ctx, userID)
		}
		return nil, fmt.Errorf("failed to get user game data: %w", err)
	}

	return &gameData, nil
}

// createInitialGameData создает начальные игровые данные для пользователя
func (r *GameRepository) createInitialGameData(ctx context.Context, userID int) (*models.UserGameData, error) {
	query := `
		INSERT INTO user_game_data (user_id, level, experience, completed_quests, total_quests)
		VALUES ($1, 1, 0, 0, 0)
		RETURNING id, user_id, level, experience, completed_quests, total_quests, created_at, updated_at
	`

	var gameData models.UserGameData
	err := r.db.GetContext(ctx, &gameData, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create initial game data: %w", err)
	}

	return &gameData, nil
}

// UpdateUserGameData обновляет игровые данные пользователя
func (r *GameRepository) UpdateUserGameData(ctx context.Context, userID int, data *models.GameDataUpdateInput) (*models.UserGameData, error) {
	query := `
		UPDATE user_game_data
		SET level = COALESCE($1, level),
			experience = COALESCE($2, experience),
			completed_quests = COALESCE($3, completed_quests),
			total_quests = COALESCE($4, total_quests),
			updated_at = NOW()
		WHERE user_id = $5
		RETURNING id, user_id, level, experience, completed_quests, total_quests, created_at, updated_at
	`

	var gameData models.UserGameData
	err := r.db.GetContext(
		ctx,
		&gameData,
		query,
		nullableIntValue(data.Level),
		nullableIntValue(data.Experience),
		nullableIntValue(data.CompletedQuests),
		nullableIntValue(data.TotalQuests),
		userID,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Если игровых данных нет, создаем их и потом обновляем
			_, err := r.createInitialGameData(ctx, userID)
			if err != nil {
				return nil, err
			}
			return r.UpdateUserGameData(ctx, userID, data)
		}
		return nil, fmt.Errorf("failed to update user game data: %w", err)
	}

	return &gameData, nil
}

// AddExperience добавляет опыт пользователю и проверяет повышение уровня
func (r *GameRepository) AddExperience(ctx context.Context, userID int, amount int) (*models.UserGameData, bool, error) {
	// Получаем текущие данные
	gameData, err := r.GetUserGameData(ctx, userID)
	if err != nil {
		return nil, false, err
	}

	currentLevel := gameData.Level
	newExperience := gameData.Experience + amount

	// Проверяем, нужно ли повысить уровень
	newLevel, levelUp := checkLevelUp(currentLevel, newExperience)

	// Обновляем данные
	updateData := &models.GameDataUpdateInput{
		Experience: &newExperience,
	}

	if levelUp {
		updateData.Level = &newLevel
	}

	updatedData, err := r.UpdateUserGameData(ctx, userID, updateData)
	if err != nil {
		return nil, false, err
	}

	return updatedData, levelUp, nil
}

// GetUserAchievements получает список достижений пользователя
func (r *GameRepository) GetUserAchievements(ctx context.Context, userID int) ([]models.UserAchievementInfo, error) {
	query := `
		SELECT 
			ua.id,
			ua.user_id,
			u.username,
			u.first_name,
			u.last_name,
			u.photo_url,
			ua.achievement_id,
			a.title as achievement_title,
			a.description as achievement_description,
			a.icon as achievement_icon,
			a.icon_src as achievement_icon_src,
			a.category as achievement_category,
			a.rarity_level as achievement_rarity,
			a.points_reward,
			ua.unlocked,
			ua.progress_current,
			ua.progress_total,
			CASE
				WHEN ua.progress_total IS NULL OR ua.progress_total = 0 THEN 0
				ELSE LEAST(100, (ua.progress_current * 100) / ua.progress_total)
			END as progress_percentage,
			ua.unlock_date
		FROM user_achievements ua
		INNER JOIN achievements a ON ua.achievement_id = a.id
		INNER JOIN users u ON ua.user_id = u.id
		WHERE ua.user_id = $1
		ORDER BY ua.unlocked DESC, a.rarity_level DESC, a.title
	`

	var achievements []models.UserAchievementInfo
	err := r.db.SelectContext(ctx, &achievements, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user achievements: %w", err)
	}

	return achievements, nil
}

// GetAchievements получает список всех достижений
func (r *GameRepository) GetAchievements(ctx context.Context) ([]models.Achievement, error) {
	query := `
		SELECT id, title, description, icon, icon_src, category, rarity_level, points_reward, created_at, updated_at
		FROM achievements
		ORDER BY rarity_level, title
	`

	var achievements []models.Achievement
	err := r.db.SelectContext(ctx, &achievements, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get achievements: %w", err)
	}

	return achievements, nil
}

// UnlockAchievement разблокирует достижение для пользователя
func (r *GameRepository) UnlockAchievement(ctx context.Context, userID int, achievementID string) (*models.UserAchievement, error) {
	// Проверяем наличие записи о достижении
	var existing models.UserAchievement
	existQuery := `
		SELECT id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
		FROM user_achievements
		WHERE user_id = $1 AND achievement_id = $2
	`

	err := r.db.GetContext(ctx, &existing, existQuery, userID, achievementID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check existing achievement: %w", err)
	}

	// Если запись уже существует и разблокирована, просто возвращаем ее
	if err == nil && existing.IsUnlocked {
		return &existing, nil
	}

	// Разблокируем достижение
	now := time.Now()

	if errors.Is(err, sql.ErrNoRows) {
		// Создаем новую запись
		insertQuery := `
			INSERT INTO user_achievements (user_id, achievement_id, is_unlocked, unlock_date)
			VALUES ($1, $2, true, $3)
			RETURNING id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
		`

		var userAchievement models.UserAchievement
		err = r.db.GetContext(ctx, &userAchievement, insertQuery, userID, achievementID, now)
		if err != nil {
			return nil, fmt.Errorf("failed to create user achievement: %w", err)
		}

		// Добавляем опыт за достижение
		r.addExperienceForAchievement(ctx, userID, achievementID)

		return &userAchievement, nil
	} else {
		// Обновляем существующую запись
		updateQuery := `
			UPDATE user_achievements
			SET is_unlocked = true, unlock_date = $3, updated_at = NOW()
			WHERE user_id = $1 AND achievement_id = $2
			RETURNING id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
		`

		var userAchievement models.UserAchievement
		err = r.db.GetContext(ctx, &userAchievement, updateQuery, userID, achievementID, now)
		if err != nil {
			return nil, fmt.Errorf("failed to update user achievement: %w", err)
		}

		// Добавляем опыт за достижение
		r.addExperienceForAchievement(ctx, userID, achievementID)

		return &userAchievement, nil
	}
}

// UpdateAchievementProgress обновляет прогресс достижения
func (r *GameRepository) UpdateAchievementProgress(ctx context.Context, userID int, achievementID string, progress int) (*models.UserAchievement, bool, error) {
	// Получаем информацию о достижении для определения общего прогресса
	var achievement models.Achievement
	achievementQuery := `
		SELECT id, title, description, icon, icon_src, category, rarity_level, exp_reward, created_at, updated_at
		FROM achievements
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &achievement, achievementQuery, achievementID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, false, repository.ErrNotFound
		}
		return nil, false, fmt.Errorf("failed to get achievement info: %w", err)
	}

	// Проверяем наличие записи о прогрессе
	var existing models.UserAchievement
	existQuery := `
		SELECT id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
		FROM user_achievements
		WHERE user_id = $1 AND achievement_id = $2
	`

	err = r.db.GetContext(ctx, &existing, existQuery, userID, achievementID)

	// Определяем total прогресс (должен быть определен в метаданных достижения)
	// Здесь используется упрощенный вариант, можно расширить логику
	totalProgress := 100 // Значение по умолчанию

	// Если запись уже разблокирована, просто возвращаем ее
	if err == nil && existing.IsUnlocked {
		return &existing, false, nil
	}

	var userAchievement models.UserAchievement
	var unlocked bool

	// Обновляем или создаем запись о прогрессе
	if errors.Is(err, sql.ErrNoRows) {
		// Проверяем, не нужно ли сразу разблокировать
		if progress >= totalProgress {
			now := time.Now()
			insertQuery := `
				INSERT INTO user_achievements (user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date)
				VALUES ($1, $2, true, $3, $4, $5)
				RETURNING id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
			`

			err = r.db.GetContext(ctx, &userAchievement, insertQuery, userID, achievementID, progress, totalProgress, now)
			if err != nil {
				return nil, false, fmt.Errorf("failed to create user achievement: %w", err)
			}

			// Добавляем опыт за достижение
			r.addExperienceForAchievement(ctx, userID, achievementID)

			return &userAchievement, true, nil
		} else {
			insertQuery := `
				INSERT INTO user_achievements (user_id, achievement_id, is_unlocked, progress, max_progress)
				VALUES ($1, $2, false, $3, $4)
				RETURNING id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
			`

			err = r.db.GetContext(ctx, &userAchievement, insertQuery, userID, achievementID, progress, totalProgress)
			if err != nil {
				return nil, false, fmt.Errorf("failed to create user achievement: %w", err)
			}

			return &userAchievement, false, nil
		}
	} else if err == nil {
		// Обновляем прогресс и проверяем разблокировку
		currentProgress := progress
		if existing.Progress > progress {
			currentProgress = existing.Progress
		}

		if currentProgress >= totalProgress && !existing.IsUnlocked {
			now := time.Now()
			updateQuery := `
				UPDATE user_achievements
				SET is_unlocked = true, progress = $3, max_progress = $4, unlock_date = $5, updated_at = NOW()
				WHERE user_id = $1 AND achievement_id = $2
				RETURNING id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
			`

			err = r.db.GetContext(ctx, &userAchievement, updateQuery, userID, achievementID, currentProgress, totalProgress, now)
			if err != nil {
				return nil, false, fmt.Errorf("failed to update user achievement: %w", err)
			}

			// Добавляем опыт за достижение
			r.addExperienceForAchievement(ctx, userID, achievementID)

			return &userAchievement, true, nil
		} else {
			updateQuery := `
				UPDATE user_achievements
				SET progress = $3, max_progress = $4, updated_at = NOW()
				WHERE user_id = $1 AND achievement_id = $2
				RETURNING id, user_id, achievement_id, is_unlocked, progress, max_progress, unlock_date, created_at, updated_at
			`

			err = r.db.GetContext(ctx, &userAchievement, updateQuery, userID, achievementID, currentProgress, totalProgress)
			if err != nil {
				return nil, false, fmt.Errorf("failed to update user achievement: %w", err)
			}

			return &userAchievement, false, nil
		}
	} else {
		return nil, false, fmt.Errorf("failed to check existing achievement: %w", err)
	}
}

// GetNotifications получает уведомления пользователя
func (r *GameRepository) GetNotifications(ctx context.Context, userID int, limit, offset int, onlyUnread bool) ([]models.NotificationInfo, error) {
	var params []interface{}
	var whereClause string

	if onlyUnread {
		whereClause = "WHERE n.user_id = $1 AND n.is_read = false"
		params = append(params, userID)
	} else {
		whereClause = "WHERE n.user_id = $1"
		params = append(params, userID)
	}

	query := fmt.Sprintf(`
		SELECT 
			n.id,
			n.user_id,
			u.username,
			u.first_name,
			u.last_name,
			n.type,
			n.title,
			n.message,
			n.request_id,
			n.achievement_id,
			n.is_read,
			n.created_at,
			r.title as request_title,
			a.title as achievement_title
		FROM notifications n
		INNER JOIN users u ON n.user_id = u.id
		LEFT JOIN help_requests r ON n.request_id = r.id
		LEFT JOIN achievements a ON n.achievement_id = a.id
		%s
		ORDER BY n.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, len(params)+1, len(params)+2)

	params = append(params, limit, offset)

	var notifications []models.NotificationInfo
	err := r.db.SelectContext(ctx, &notifications, query, params...)
	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}

	return notifications, nil
}

// MarkNotificationAsRead помечает уведомление как прочитанное
func (r *GameRepository) MarkNotificationAsRead(ctx context.Context, userID int, notificationID string) error {
	query := `
		UPDATE notifications
		SET is_read = true
		WHERE id = $1 AND user_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, notificationID, userID)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}

	return nil
}

// CreateNotification создает новое уведомление
func (r *GameRepository) CreateNotification(ctx context.Context, notification *models.Notification) (*models.Notification, error) {
	query := `
		INSERT INTO notifications (
			id, user_id, type, title, message, request_id, achievement_id, is_read, created_at
		) VALUES (
			:id, :user_id, :type, :title, :message, :request_id, :achievement_id, :is_read, :created_at
		) RETURNING id, user_id, type, title, message, request_id, achievement_id, is_read, created_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, notification)
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("no rows returned after notification creation")
	}

	var createdNotification models.Notification
	if err := rows.StructScan(&createdNotification); err != nil {
		return nil, fmt.Errorf("failed to scan created notification: %w", err)
	}

	return &createdNotification, nil
}

// addExperienceForAchievement добавляет опыт за разблокировку достижения
func (r *GameRepository) addExperienceForAchievement(ctx context.Context, userID int, achievementID string) error {
	// Получаем информацию о достижении для определения награды опыта
	var achievement models.Achievement
	achievementQuery := `
		SELECT id, title, description, icon, icon_src, category, rarity_level, points_reward, created_at, updated_at
		FROM achievements
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &achievement, achievementQuery, achievementID)
	if err != nil {
		return fmt.Errorf("failed to get achievement info: %w", err)
	}

	// Добавляем опыт пользователю
	_, _, err = r.AddExperience(ctx, userID, achievement.PointsReward)
	if err != nil {
		return fmt.Errorf("failed to add experience: %w", err)
	}

	return nil
}

// calculateNextLevelExperience вычисляет опыт для следующего уровня
func calculateNextLevelExperience(level int) int {
	return int(100 * math.Pow(1.5, float64(level-1)))
}

// checkLevelUp проверяет, нужно ли повысить уровень
func checkLevelUp(currentLevel int, experience int) (int, bool) {
	newLevel := currentLevel
	levelUp := false

	// Проверяем, достаточно ли опыта для повышения уровня
	for {
		nextLevelExp := calculateNextLevelExperience(newLevel)
		if experience >= nextLevelExp {
			newLevel++
			levelUp = true
		} else {
			break
		}
	}

	return newLevel, levelUp
}

// nullableIntValue возвращает SQL-представление nullable-значения
func nullableIntValue(value *int) interface{} {
	if value == nil {
		return nil
	}
	return *value
}

// GetAchievementByID получает информацию о достижении по ID
func (r *GameRepository) GetAchievementByID(ctx context.Context, achievementID string) (*models.Achievement, error) {
	query := `
		SELECT id, title, description, icon, icon_src, category, rarity_level, exp_reward, created_at, updated_at
		FROM achievements
		WHERE id = $1
	`

	var achievement models.Achievement
	err := r.db.GetContext(ctx, &achievement, query, achievementID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get achievement: %w", err)
	}

	return &achievement, nil
}

package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository"
)

// GameService предоставляет методы для работы с игровыми функциями
type GameService struct {
	gameRepo       *repository.GameRepository
	userRepo       *repository.UserRepository
	requestRepo    *repository.RequestRepository
	achievementSvc *AchievementService
}

// NewGameService создает новый экземпляр GameService
func NewGameService(
	gameRepo *repository.GameRepository,
	userRepo *repository.UserRepository,
	requestRepo *repository.RequestRepository,
	achievementSvc *AchievementService,
) *GameService {
	return &GameService{
		gameRepo:       gameRepo,
		userRepo:       userRepo,
		requestRepo:    requestRepo,
		achievementSvc: achievementSvc,
	}
}

// GetUserGameData получает игровые данные пользователя
func (s *GameService) GetUserGameData(ctx context.Context, userID int) (*models.UserGameData, error) {
	// Получаем базовый профиль
	gameData, err := s.gameRepo.GetUserGameData(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Если у пользователя нет игрового профиля, создаем его
	if gameData == nil {
		gameData = &models.UserGameData{
			UserID:     userID,
			Level:      1,
			Experience: 0,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		// Сохраняем новый профиль
		err = s.gameRepo.SaveUserGameData(ctx, gameData)
		if err != nil {
			return nil, err
		}
	}

	// Получаем достижения пользователя
	achievements, err := s.gameRepo.GetUserAchievements(ctx, userID)
	if err != nil {
		return nil, err
	}
	gameData.Achievements = achievements

	return gameData, nil
}

// UpdateUserGameData обновляет игровые данные пользователя
func (s *GameService) UpdateUserGameData(ctx context.Context, userID int, data *models.GameDataUpdateInput) (*models.UserGameData, error) {
	// Проверка корректности входных данных
	if data.Level != nil && *data.Level < 1 {
		return nil, fmt.Errorf("level cannot be less than 1")
	}
	if data.Experience != nil && *data.Experience < 0 {
		return nil, fmt.Errorf("experience cannot be negative")
	}
	if data.CompletedQuests != nil && *data.CompletedQuests < 0 {
		return nil, fmt.Errorf("completed quests cannot be negative")
	}
	if data.TotalQuests != nil && *data.TotalQuests < 0 {
		return nil, fmt.Errorf("total quests cannot be negative")
	}

	return s.gameRepo.UpdateUserGameData(ctx, userID, data)
}

// AddExperience добавляет опыт пользователю и обрабатывает повышение уровня
func (s *GameService) AddExperience(ctx context.Context, userID int, expPoints int) (*models.LevelUpResult, error) {
	if expPoints <= 0 {
		return nil, errors.New("experience points must be positive")
	}

	// Получаем текущие игровые данные пользователя
	gameData, err := s.GetUserGameData(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Добавляем опыт
	oldLevel := gameData.Level
	gameData.Experience += expPoints

	// Проверяем повышение уровня
	result := &models.LevelUpResult{
		OldLevel:      oldLevel,
		NewLevel:      oldLevel,
		ExperienceAdd: expPoints,
	}

	// Проверяем необходимость повышения уровня
	for {
		expForNextLevel := s.calculateExperienceForLevel(gameData.Level + 1)
		if gameData.Experience >= expForNextLevel {
			gameData.Level++
			result.NewLevel = gameData.Level
		} else {
			break
		}
	}

	// Сохраняем обновленные данные
	gameData.UpdatedAt = time.Now()
	err = s.gameRepo.SaveUserGameData(ctx, gameData)
	if err != nil {
		return nil, err
	}

	// Если произошло повышение уровня, возвращаем информацию
	if result.NewLevel > oldLevel {
		// Проверяем достижения, связанные с уровнем
		s.achievementSvc.CheckLevelAchievements(ctx, userID, result.NewLevel)
	}

	return result, nil
}

// GetUserAchievements получает достижения пользователя
func (s *GameService) GetUserAchievements(ctx context.Context, userID int) ([]models.UserAchievementInfo, error) {
	return s.gameRepo.GetUserAchievements(ctx, userID)
}

// GetAllAchievements получает все доступные достижения
func (s *GameService) GetAllAchievements(ctx context.Context) ([]models.Achievement, error) {
	return s.gameRepo.GetAchievements(ctx)
}

// UnlockAchievement разблокирует достижение для пользователя
func (s *GameService) UnlockAchievement(ctx context.Context, userID int, achievementID string) error {
	// Проверяем, существует ли достижение
	achievement, err := s.gameRepo.GetAchievementByID(ctx, achievementID)
	if err != nil {
		return err
	}
	if achievement == nil {
		return errors.New("achievement not found")
	}

	// Проверяем, не разблокировано ли уже достижение
	hasAchievement, err := s.gameRepo.HasUserAchievement(ctx, userID, achievementID)
	if err != nil {
		return err
	}
	if hasAchievement {
		return nil // Достижение уже разблокировано
	}

	// Разблокируем достижение
	userAchievement := &models.UserAchievement{
		UserID:        userID,
		AchievementID: achievementID,
		UnlockedAt:    time.Now(),
		IsNew:         true,
	}

	// Сохраняем разблокировку
	err = s.gameRepo.SaveUserAchievement(ctx, userAchievement)
	if err != nil {
		return err
	}

	// Если за достижение положен опыт, добавляем его
	if achievement.ExpReward > 0 {
		_, err = s.AddExperience(ctx, userID, achievement.ExpReward)
		if err != nil {
			return err
		}
	}

	return nil
}

// UpdateAchievementProgress обновляет прогресс достижения
func (s *GameService) UpdateAchievementProgress(ctx context.Context, userID int, progress *models.AchievementProgress) (*models.UserAchievement, error) {
	achievement, unlocked, err := s.gameRepo.UpdateAchievementProgress(ctx, userID, progress.AchievementID, progress.ProgressCurrent)
	if err != nil {
		return nil, err
	}

	// Если достижение было разблокировано, создаем уведомление
	if unlocked {
		notification := &models.Notification{
			ID:            uuid.New().String(),
			UserID:        userID,
			Type:          models.NotificationTypeAchievementUnlocked,
			Title:         "Новое достижение!",
			Message:       "Вы разблокировали новое достижение",
			AchievementID: &progress.AchievementID,
			IsRead:        false,
			CreatedAt:     time.Now(),
		}

		_, err = s.gameRepo.CreateNotification(ctx, notification)
		if err != nil {
			// Логируем ошибку, но не прерываем выполнение
			fmt.Printf("Failed to create achievement notification: %v\n", err)
		}
	}

	return achievement, nil
}

// GetUserNotifications получает уведомления пользователя
func (s *GameService) GetUserNotifications(ctx context.Context, userID int, limit, offset int, onlyUnread bool) ([]models.NotificationInfo, error) {
	return s.gameRepo.GetNotifications(ctx, userID, limit, offset, onlyUnread)
}

// MarkNotificationAsRead помечает уведомление как прочитанное
func (s *GameService) MarkNotificationAsRead(ctx context.Context, userID int, notificationID string) error {
	return s.gameRepo.MarkNotificationAsRead(ctx, userID, notificationID)
}

// GetLeaderboard получает лидеров по очкам опыта
func (s *GameService) GetLeaderboard(ctx context.Context, limit, offset int) ([]*models.LeaderboardUser, error) {
	return s.gameRepo.GetLeaderboard(ctx, limit, offset)
}

// GetAchievements получает все доступные достижения
func (s *GameService) GetAchievements(ctx context.Context) ([]*models.Achievement, error) {
	return s.gameRepo.GetAllAchievements(ctx)
}

// calculateExperienceForLevel вычисляет опыт, необходимый для достижения уровня
func (s *GameService) calculateExperienceForLevel(level int) int {
	// Простая формула: 100 * (уровень ^ 2)
	if level <= 1 {
		return 0
	}
	return 100 * (level * level)
}

// SyncGameData синхронизирует игровые данные пользователя
func (s *GameService) SyncGameData(ctx context.Context, userID int) error {
	// Получаем текущие игровые данные
	gameData, err := s.GetUserGameData(ctx, userID)
	if err != nil {
		return err
	}

	// Проверяем прогресс в заявках
	requestStats, err := s.requestRepo.GetUserRequestStats(ctx, userID)
	if err != nil {
		return err
	}

	// Проверяем условия для достижений на основе заявок
	if requestStats != nil {
		s.achievementSvc.CheckRequestAchievements(ctx, userID, requestStats)
	}

	return nil
}

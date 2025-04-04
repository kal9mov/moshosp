package models

import (
	"time"
)

// AchievementCategory представляет категорию достижения
type AchievementCategory string

// Константы для категорий достижений
const (
	AchievementCategoryEducational AchievementCategory = "educational"
	AchievementCategorySocial      AchievementCategory = "social"
	AchievementCategoryTechnical   AchievementCategory = "technical"
	AchievementCategorySpecial     AchievementCategory = "special"
)

// RarityLevel представляет уровень редкости достижения
type RarityLevel string

// Константы для уровней редкости достижений
const (
	RarityLevelCommon    RarityLevel = "common"
	RarityLevelUncommon  RarityLevel = "uncommon"
	RarityLevelRare      RarityLevel = "rare"
	RarityLevelEpic      RarityLevel = "epic"
	RarityLevelLegendary RarityLevel = "legendary"
)

// Achievement представляет модель достижения
type Achievement struct {
	ID          string    `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	IconURL     string    `json:"icon_url" db:"icon_url"`
	Category    string    `json:"category" db:"category"`
	ExpReward   int       `json:"exp_reward" db:"exp_reward"`
	Conditions  string    `json:"conditions" db:"conditions"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// UserAchievement связывает пользователя с достижением
type UserAchievement struct {
	ID            int        `json:"id" db:"id"`
	UserID        int        `json:"user_id" db:"user_id"`
	AchievementID string     `json:"achievement_id" db:"achievement_id"`
	UnlockedAt    time.Time  `json:"unlocked_at" db:"unlocked_at"`
	IsNew         bool       `json:"is_new" db:"is_new"`
	IsUnlocked    bool       `json:"is_unlocked" db:"is_unlocked"`
	Progress      int        `json:"progress" db:"progress"`
	MaxProgress   int        `json:"max_progress" db:"max_progress"`
	UnlockDate    *time.Time `json:"unlock_date" db:"unlock_date"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

// UserAchievementInfo представляет полную информацию о достижении пользователя
type UserAchievementInfo struct {
	ID                  int                 `json:"id" db:"id"`
	UserID              int                 `json:"userId" db:"user_id"`
	Username            string              `json:"username" db:"username"`
	FirstName           string              `json:"firstName" db:"first_name"`
	LastName            string              `json:"lastName" db:"last_name"`
	PhotoURL            string              `json:"photoUrl" db:"photo_url"`
	AchievementID       string              `json:"achievementId" db:"achievement_id"`
	AchievementTitle    string              `json:"achievementTitle" db:"achievement_title"`
	AchievementDesc     string              `json:"achievementDescription" db:"achievement_description"`
	AchievementIcon     string              `json:"achievementIcon" db:"achievement_icon"`
	AchievementIconSrc  string              `json:"achievementIconSrc" db:"achievement_icon_src"`
	AchievementCategory AchievementCategory `json:"achievementCategory" db:"achievement_category"`
	AchievementRarity   RarityLevel         `json:"achievementRarity" db:"achievement_rarity"`
	PointsReward        int                 `json:"pointsReward" db:"points_reward"`
	Unlocked            bool                `json:"unlocked" db:"unlocked"`
	ProgressCurrent     *int                `json:"progressCurrent" db:"progress_current"`
	ProgressTotal       *int                `json:"progressTotal" db:"progress_total"`
	ProgressPercentage  int                 `json:"progressPercentage" db:"progress_percentage"`
	UnlockDate          *time.Time          `json:"unlockDate" db:"unlock_date"`
}

// NotificationType определяет тип уведомления
type NotificationType string

const (
	NotificationTypeLevelUp             NotificationType = "level_up"
	NotificationTypeAchievementUnlocked NotificationType = "achievement_unlocked"
	NotificationTypeRequestCompleted    NotificationType = "request_completed"
	NotificationTypeRequestAccepted     NotificationType = "request_accepted"
	NotificationTypeRequestCancelled    NotificationType = "request_cancelled"
)

// Notification представляет модель уведомления для пользователя
type Notification struct {
	ID            string           `json:"id" db:"id"`
	UserID        int              `json:"user_id" db:"user_id"`
	Type          NotificationType `json:"type" db:"type"`
	Title         string           `json:"title" db:"title"`
	Message       string           `json:"message" db:"message"`
	AchievementID *string          `json:"achievement_id,omitempty" db:"achievement_id"`
	RequestID     *int             `json:"request_id,omitempty" db:"request_id"`
	IsRead        bool             `json:"is_read" db:"is_read"`
	CreatedAt     time.Time        `json:"created_at" db:"created_at"`
}

// NotificationInfo представляет уведомление с дополнительной информацией
type NotificationInfo struct {
	ID               string           `json:"id" db:"id"`
	UserID           int              `json:"userId" db:"user_id"`
	Username         string           `json:"username" db:"username"`
	FirstName        string           `json:"firstName" db:"first_name"`
	LastName         string           `json:"lastName" db:"last_name"`
	Type             NotificationType `json:"type" db:"type"`
	Title            string           `json:"title" db:"title"`
	Message          string           `json:"message" db:"message"`
	RequestID        *int             `json:"requestId" db:"request_id"`
	AchievementID    *string          `json:"achievementId" db:"achievement_id"`
	IsRead           bool             `json:"isRead" db:"is_read"`
	CreatedAt        time.Time        `json:"createdAt" db:"created_at"`
	RequestTitle     *string          `json:"requestTitle" db:"request_title"`
	AchievementTitle *string          `json:"achievementTitle" db:"achievement_title"`
}

// UserGameData представляет игровые данные пользователя
type UserGameData struct {
	ID           int                `json:"id" db:"id"`
	UserID       int                `json:"user_id" db:"user_id"`
	Level        int                `json:"level" db:"level"`
	Experience   int                `json:"experience" db:"experience"`
	Achievements []*UserAchievement `json:"achievements,omitempty" db:"-"`
	CreatedAt    time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" db:"updated_at"`
}

// GameDataUpdateInput представляет данные для обновления игровых данных
type GameDataUpdateInput struct {
	Level           *int `json:"level"`
	Experience      *int `json:"experience"`
	CompletedQuests *int `json:"completedQuests"`
	TotalQuests     *int `json:"totalQuests"`
}

// AchievementProgress представляет прогресс пользователя в достижении
type AchievementProgress struct {
	ID            int       `json:"id" db:"id"`
	UserID        int       `json:"user_id" db:"user_id"`
	AchievementID string    `json:"achievement_id" db:"achievement_id"`
	Progress      int       `json:"progress" db:"progress"`
	MaxProgress   int       `json:"max_progress" db:"max_progress"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// UnlockAchievementInput представляет данные для разблокировки достижения
type UnlockAchievementInput struct {
	AchievementID     string `json:"achievementId" validate:"required"`
	UnlockImmediately bool   `json:"unlockImmediately"`
}

// AddExperienceInput представляет данные для добавления опыта
type AddExperienceInput struct {
	Amount int    `json:"amount" validate:"required,min=1"`
	Source string `json:"source"`
}

// LevelUpResult содержит информацию о повышении уровня
type LevelUpResult struct {
	OldLevel      int `json:"old_level"`
	NewLevel      int `json:"new_level"`
	ExperienceAdd int `json:"experience_add"`
}

// GameStats представляет игровую статистику
type GameStats struct {
	TotalUsers        int `json:"total_users"`
	TotalAchievements int `json:"total_achievements"`
	TotalRequests     int `json:"total_requests"`
	CompletedRequests int `json:"completed_requests"`
}

// GameLeaderboardUser представляет пользователя в таблице лидеров для игрового сервиса
type GameLeaderboardUser struct {
	ID         int    `json:"id" db:"id"`
	Username   string `json:"username" db:"username"`
	FirstName  string `json:"first_name" db:"first_name"`
	LastName   string `json:"last_name,omitempty" db:"last_name"`
	PhotoURL   string `json:"photo_url,omitempty" db:"photo_url"`
	Level      int    `json:"level" db:"level"`
	Experience int    `json:"experience" db:"experience"`
	Rank       int    `json:"rank" db:"rank"`
}

// UserRequestStats представляет статистику запросов пользователя
type UserRequestStats struct {
	TotalCreated   int `json:"total_created" db:"total_created"`
	TotalAccepted  int `json:"total_accepted" db:"total_accepted"`
	TotalHelped    int `json:"total_helped" db:"total_helped"`
	TotalCompleted int `json:"total_completed" db:"total_completed"`
}

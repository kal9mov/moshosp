package models

import (
	"time"
)

// UserRole представляет роль пользователя в системе
type UserRole string

// Определение констант для ролей пользователей
const (
	UserRoleUser      UserRole = "user"
	UserRoleVolunteer UserRole = "volunteer"
	UserRoleAdmin     UserRole = "admin"
)

// User представляет модель пользователя
type User struct {
	ID         int        `json:"id" db:"id"`
	TelegramID string     `json:"telegramId" db:"telegram_id"`
	Username   string     `json:"username" db:"username"`
	FirstName  string     `json:"firstName" db:"first_name"`
	LastName   string     `json:"lastName" db:"last_name"`
	PhotoURL   string     `json:"photoUrl" db:"photo_url"`
	Phone      string     `json:"phone" db:"phone"`
	Address    string     `json:"address" db:"address"`
	About      string     `json:"about" db:"about"`
	Role       UserRole   `json:"role" db:"role"`
	IsDeleted  bool       `json:"isDeleted" db:"is_deleted"`
	CreatedAt  time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time  `json:"updatedAt" db:"updated_at"`
	Stats      *UserStats `json:"stats,omitempty" db:"-"`
}

// UserStats представляет статистику пользователя
type UserStats struct {
	ID                int       `json:"id" db:"id"`
	UserID            int       `json:"userId" db:"user_id"`
	Level             int       `json:"level" db:"level"`
	Experience        int       `json:"experience" db:"experience"`
	CompletedRequests int       `json:"completedRequests" db:"completed_requests"`
	CreatedRequests   int       `json:"createdRequests" db:"created_requests"`
	VolunteerHours    int       `json:"volunteerHours" db:"volunteer_hours"`
	Rating            float64   `json:"rating" db:"rating"`
	CreatedAt         time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt         time.Time `json:"updatedAt" db:"updated_at"`
}

// UserFullInfo представляет полную информацию о пользователе
type UserFullInfo struct {
	User
	Level                  int     `json:"level" db:"level"`
	Experience             int     `json:"experience" db:"experience"`
	CompletedRequests      int     `json:"completedRequests" db:"completed_requests"`
	CreatedRequests        int     `json:"createdRequests" db:"created_requests"`
	VolunteerHours         int     `json:"volunteerHours" db:"volunteer_hours"`
	Rating                 float64 `json:"rating" db:"rating"`
	AchievementsCount      int     `json:"achievementsCount" db:"achievements_count"`
	TotalRequestsCreated   int     `json:"totalRequestsCreated" db:"total_requests_created"`
	TotalRequestsTaken     int     `json:"totalRequestsTaken" db:"total_requests_taken"`
	TotalRequestsCompleted int     `json:"totalRequestsCompleted" db:"total_requests_completed"`
}

// UserAuthInput представляет данные для аутентификации пользователя через Telegram
type UserAuthInput struct {
	ID        string `json:"id" validate:"required"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
	PhotoURL  string `json:"photo_url"`
	AuthDate  int64  `json:"auth_date" validate:"required"`
	Hash      string `json:"hash" validate:"required"`
}

// UserProfileUpdate представляет данные для обновления профиля пользователя
type UserProfileUpdate struct {
	Phone   string `json:"phone"`
	Address string `json:"address"`
	About   string `json:"about"`
}

// UserToken представляет токен аутентификации
type UserToken struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// AuthResponse представляет ответ при успешной аутентификации
type AuthResponse struct {
	User  User      `json:"user"`
	Token UserToken `json:"token"`
}

// LeaderboardUser представляет пользователя в списке лидеров
type LeaderboardUser struct {
	ID                int    `json:"id" db:"id"`
	Rank              int    `json:"rank" db:"rank"`
	Username          string `json:"username" db:"username"`
	FirstName         string `json:"firstName" db:"first_name"`
	LastName          string `json:"lastName" db:"last_name"`
	PhotoURL          string `json:"photoUrl" db:"photo_url"`
	Level             int    `json:"level" db:"level"`
	Points            int    `json:"points" db:"points"`
	CompletedRequests int    `json:"completedRequests" db:"completed_requests"`
	AchievementsCount int    `json:"achievementsCount" db:"achievements_count"`
	IsCurrentUser     bool   `json:"isCurrentUser" db:"-"`
}

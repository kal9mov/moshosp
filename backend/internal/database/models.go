package database

import (
	"time"
)

// User представляет пользователя системы
type User struct {
	ID         int        `db:"id" json:"id"`
	TelegramID string     `db:"telegram_id" json:"telegramId"`
	Username   string     `db:"username" json:"username"`
	FirstName  string     `db:"first_name" json:"firstName"`
	LastName   string     `db:"last_name" json:"lastName"`
	PhotoURL   string     `db:"photo_url" json:"photoUrl"`
	Role       string     `db:"role" json:"role"`
	CreatedAt  time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt  time.Time  `db:"updated_at" json:"updatedAt"`
	Stats      *UserStats `json:"stats,omitempty"` // Не хранится в таблице users
}

// UserStats представляет игровую статистику пользователя
type UserStats struct {
	ID                int       `db:"id" json:"id"`
	UserID            int       `db:"user_id" json:"userId"`
	Level             int       `db:"level" json:"level"`
	Experience        int       `db:"experience" json:"experience"`
	CompletedRequests int       `db:"completed_requests" json:"completedRequests"`
	CreatedRequests   int       `db:"created_requests" json:"createdRequests"`
	VolunteerHours    int       `db:"volunteer_hours" json:"volunteerHours"`
	Rating            float64   `db:"rating" json:"rating"`
	CreatedAt         time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt         time.Time `db:"updated_at" json:"updatedAt"`
}

// HelpRequest представляет запрос о помощи
type HelpRequest struct {
	ID          int        `db:"id" json:"id"`
	Title       string     `db:"title" json:"title"`
	Description string     `db:"description" json:"description"`
	Status      string     `db:"status" json:"status"`
	Category    string     `db:"category" json:"category"`
	Priority    string     `db:"priority" json:"priority"`
	Location    string     `db:"location" json:"location"`
	RequesterID int        `db:"requester_id" json:"requesterId"`
	AssignedTo  *int       `db:"assigned_to" json:"assignedTo,omitempty"`
	CreatedAt   time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updatedAt"`
	CompletedAt *time.Time `db:"completed_at" json:"completedAt,omitempty"`
	Requester   *User      `json:"requester,omitempty"` // Не хранится в таблице help_requests
	Volunteer   *User      `json:"volunteer,omitempty"` // Не хранится в таблице help_requests
}

// Achievement представляет достижение в системе геймификации
type Achievement struct {
	ID          int       `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description"`
	Icon        string    `db:"icon" json:"icon"`
	Category    string    `db:"category" json:"category"`
	Points      int       `db:"points" json:"points"`
	Rarity      string    `db:"rarity" json:"rarity"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
}

// UserAchievement представляет связь между пользователем и достижением
type UserAchievement struct {
	ID            int          `db:"id" json:"id"`
	UserID        int          `db:"user_id" json:"userId"`
	AchievementID int          `db:"achievement_id" json:"achievementId"`
	UnlockedAt    time.Time    `db:"unlocked_at" json:"unlockedAt"`
	Achievement   *Achievement `json:"achievement,omitempty"` // Не хранится в таблице user_achievements
}

// RequestCreateParams содержит параметры для создания запроса о помощи
type RequestCreateParams struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Priority    string `json:"priority"`
	Location    string `json:"location"`
	RequesterID int    `json:"-"` // Устанавливается сервером, а не клиентом
}

// RequestUpdateParams содержит параметры для обновления запроса
type RequestUpdateParams struct {
	Title       *string    `json:"title,omitempty"`
	Description *string    `json:"description,omitempty"`
	Status      *string    `json:"status,omitempty"`
	Category    *string    `json:"category,omitempty"`
	Priority    *string    `json:"priority,omitempty"`
	Location    *string    `json:"location,omitempty"`
	AssignedTo  *int       `json:"assignedTo,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
}

// UserUpdateParams содержит параметры для обновления пользователя
type UserUpdateParams struct {
	Username  *string `json:"username,omitempty"`
	FirstName *string `json:"firstName,omitempty"`
	LastName  *string `json:"lastName,omitempty"`
	PhotoURL  *string `json:"photoUrl,omitempty"`
	Role      *string `json:"role,omitempty"`
}

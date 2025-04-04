package handlers

import (
	"github.com/go-chi/chi/v5"
)

// RegisterGameRoutes регистрирует маршруты для игровой механики
func RegisterGameRoutes(r chi.Router, h *GameHandler) {
	// Профиль игрока
	r.Get("/api/game/profile", h.GetUserGameData)

	// Достижения
	r.Get("/api/game/achievements", h.GetUserAchievements)
	r.Get("/api/game/achievements/all", h.GetAllAchievements)
	r.Post("/api/game/achievements/unlock", h.UnlockAchievement)

	// Рейтинг
	r.Get("/api/game/leaderboard", h.GetLeaderboard)

	// Опыт
	r.Post("/api/game/experience", h.AddExperience)

	// Уведомления
	r.Get("/api/game/notifications", h.GetNotifications)
	r.Post("/api/game/notifications/read", h.MarkNotificationRead)
	r.Post("/api/game/notifications/readall", h.MarkAllNotificationsRead)
}

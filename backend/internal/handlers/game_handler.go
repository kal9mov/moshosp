package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/kal9mov/moshosp/backend/internal/domain/models"
	"github.com/kal9mov/moshosp/backend/internal/middleware"
	"github.com/kal9mov/moshosp/backend/internal/services"
	"github.com/kal9mov/moshosp/backend/internal/utils"
)

// GameHandler содержит обработчики для игровых функций
type GameHandler struct {
	gameService *services.GameService
	userService *services.UserService
	jwtSecret   string
}

// NewGameHandler создает новый экземпляр GameHandler
func NewGameHandler(gameService *services.GameService, userService *services.UserService, jwtSecret string) *GameHandler {
	return &GameHandler{
		gameService: gameService,
		userService: userService,
		jwtSecret:   jwtSecret,
	}
}

// GetUserGameProfile возвращает игровой профиль текущего пользователя
func (h *GameHandler) GetUserGameProfile(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Синхронизируем игровые данные
	if err := h.gameService.SyncGameData(r.Context(), userID); err != nil {
		http.Error(w, "Failed to sync game data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Получаем игровые данные пользователя
	gameData, err := h.gameService.GetUserGameData(r.Context(), userID)
	if err != nil {
		http.Error(w, "Failed to get user game data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gameData)
}

// MarkAchievementRead отмечает достижение как прочитанное
func (h *GameHandler) MarkAchievementRead(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Получаем ID достижения из URL
	achievementID := chi.URLParam(r, "id")
	if achievementID == "" {
		http.Error(w, "Achievement ID is required", http.StatusBadRequest)
		return
	}

	// Отмечаем достижение как прочитанное
	err = h.gameService.MarkAchievementRead(r.Context(), userID, achievementID)
	if err != nil {
		http.Error(w, "Failed to mark achievement as read: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// GetLeaderboard возвращает таблицу лидеров
func (h *GameHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	// Получаем параметры пагинации
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 10 // Значение по умолчанию
	}

	// Получаем лидеров
	leaderboard, err := h.gameService.GetLeaderboard(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to get leaderboard: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(leaderboard)
}

// GetAchievements возвращает список всех достижений
func (h *GameHandler) GetAchievements(w http.ResponseWriter, r *http.Request) {
	// Получаем все достижения
	achievements, err := h.gameService.GetAchievements(r.Context())
	if err != nil {
		http.Error(w, "Failed to get achievements: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(achievements)
}

// AddExperience добавляет опыт пользователю
func (h *GameHandler) AddExperience(w http.ResponseWriter, r *http.Request) {
	// Только для тестирования и разработки, в продакшне должен быть доступен только админам

	// Получаем ID пользователя из контекста
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Парсим тело запроса
	var input struct {
		Experience int `json:"experience"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Experience <= 0 {
		http.Error(w, "Experience must be positive", http.StatusBadRequest)
		return
	}

	// Добавляем опыт
	result, err := h.gameService.AddExperience(r.Context(), userID, input.Experience)
	if err != nil {
		http.Error(w, "Failed to add experience: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// RegisterGameRoutes регистрирует игровые маршруты
func (h *GameHandler) RegisterGameRoutes(r chi.Router) {
	// Маршруты, требующие аутентификации
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(h.jwtSecret))

		r.Get("/game/profile", h.GetUserGameProfile)
		r.Get("/game/leaderboard", h.GetLeaderboard)
		r.Get("/game/achievements", h.GetAchievements)
		r.Put("/game/achievements/{id}/read", h.MarkAchievementRead)

		// Маршруты для тестирования и администраторов
		r.Group(func(r chi.Router) {
			r.Use(middleware.AdminOnly)
			r.Post("/game/experience", h.AddExperience)
		})
	})
}

// GetUserGameData возвращает игровые данные пользователя
// @Summary Получить игровые данные пользователя
// @Description Возвращает игровые данные авторизованного пользователя
// @Tags game
// @Accept json
// @Produce json
// @Success 200 {object} models.UserGameData
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/profile [get]
func (h *GameHandler) GetUserGameData(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	gameData, err := h.gameService.GetUserGameData(r.Context(), userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get game data")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, gameData)
}

// GetUserAchievements возвращает достижения пользователя
// @Summary Получить достижения пользователя
// @Description Возвращает список достижений авторизованного пользователя
// @Tags game
// @Accept json
// @Produce json
// @Success 200 {array} models.UserAchievementInfo
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/achievements [get]
func (h *GameHandler) GetUserAchievements(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	achievements, err := h.gameService.GetUserAchievements(r.Context(), userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get achievements")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, achievements)
}

// GetAllAchievements возвращает все доступные достижения
// @Summary Получить все достижения
// @Description Возвращает список всех доступных достижений
// @Tags game
// @Accept json
// @Produce json
// @Success 200 {array} models.Achievement
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/achievements/all [get]
func (h *GameHandler) GetAllAchievements(w http.ResponseWriter, r *http.Request) {
	achievements, err := h.gameService.GetAllAchievements(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get achievements")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, achievements)
}

// UpdateAchievementProgress обновляет прогресс достижения
// @Summary Обновить прогресс достижения
// @Description Обновляет прогресс достижения для авторизованного пользователя
// @Tags game
// @Accept json
// @Produce json
// @Param progress body models.AchievementProgress true "Данные о прогрессе"
// @Success 200 {object} models.UserAchievement
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/achievements/progress [post]
func (h *GameHandler) UpdateAchievementProgress(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var progress models.AchievementProgress
	if err := json.NewDecoder(r.Body).Decode(&progress); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	achievement, err := h.gameService.UpdateAchievementProgress(r.Context(), userID, &progress)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update achievement progress")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, achievement)
}

// UnlockAchievement разблокирует достижение
// @Summary Разблокировать достижение
// @Description Разблокирует достижение для авторизованного пользователя
// @Tags game
// @Accept json
// @Produce json
// @Param unlock body models.UnlockAchievementInput true "Данные для разблокировки"
// @Success 200 {object} models.UserAchievement
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/achievements/unlock [post]
func (h *GameHandler) UnlockAchievement(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var input models.UnlockAchievementInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	achievement, err := h.gameService.UnlockAchievement(r.Context(), userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to unlock achievement")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, achievement)
}

// GetUserNotifications возвращает уведомления пользователя
// @Summary Получить уведомления пользователя
// @Description Возвращает список уведомлений авторизованного пользователя
// @Tags game
// @Accept json
// @Produce json
// @Param unread query bool false "Только непрочитанные"
// @Param limit query int false "Лимит количества записей" default(10)
// @Param offset query int false "Смещение для пагинации" default(0)
// @Success 200 {array} models.NotificationInfo
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/notifications [get]
func (h *GameHandler) GetUserNotifications(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	limit := 10
	offset := 0
	onlyUnread := false

	// Разбор параметров запроса
	limitStr := r.URL.Query().Get("limit")
	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid limit parameter")
			return
		}
	}

	offsetStr := r.URL.Query().Get("offset")
	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid offset parameter")
			return
		}
	}

	unreadStr := r.URL.Query().Get("unread")
	if unreadStr == "true" {
		onlyUnread = true
	}

	notifications, err := h.gameService.GetUserNotifications(r.Context(), userID, limit, offset, onlyUnread)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get notifications")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, notifications)
}

// MarkNotificationAsRead помечает уведомление как прочитанное
// @Summary Пометить уведомление как прочитанное
// @Description Помечает уведомление как прочитанное для авторизованного пользователя
// @Tags game
// @Accept json
// @Produce json
// @Param id path string true "ID уведомления"
// @Success 200 {object} utils.StatusResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/game/notifications/{id}/read [post]
func (h *GameHandler) MarkNotificationAsRead(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	notificationID := chi.URLParam(r, "id")
	if notificationID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Missing notification ID")
		return
	}

	err = h.gameService.MarkNotificationAsRead(r.Context(), userID, notificationID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to mark notification as read")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, utils.StatusResponse{Status: "success"})
}

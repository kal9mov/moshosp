package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"
	"moshosp/backend/internal/database"
	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/middleware"
	"moshosp/backend/internal/services"
	"moshosp/backend/internal/utils"
)

// UserHandler обрабатывает запросы, связанные с пользователями
type UserHandler struct {
	repo        *database.Repository
	userService *services.UserService
	gameService *services.GameService
	JWTSecret   string
	JWTExpiry   time.Duration
}

// NewUserHandler создает новый обработчик пользователей
func NewUserHandler(db *sqlx.DB, userService *services.UserService, gameService *services.GameService, jwtSecret string, jwtExpiry time.Duration) *UserHandler {
	return &UserHandler{
		repo:        database.NewRepository(db),
		userService: userService,
		gameService: gameService,
		JWTSecret:   jwtSecret,
		JWTExpiry:   jwtExpiry,
	}
}

// Login аутентифицирует пользователя и выдает JWT токен
// @Summary Аутентификация пользователя
// @Description Аутентифицирует пользователя по данным из Telegram и выдает JWT токены
// @Tags auth
// @Accept json
// @Produce json
// @Param input body models.UserAuthInput true "Данные аутентификации"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/auth/login [post]
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input models.UserAuthInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Аутентифицируем пользователя
	authResponse, err := h.userService.Login(r.Context(), &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Authentication failed: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, authResponse)
}

// AuthWithTelegram аутентифицирует пользователя через Telegram
// @Summary Аутентификация пользователя
// @Description Аутентифицирует пользователя по данным из Telegram и выдает JWT токены
// @Tags auth
// @Accept json
// @Produce json
// @Param input body models.UserAuthInput true "Данные аутентификации"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/auth/telegram [post]
func (h *UserHandler) AuthWithTelegram(w http.ResponseWriter, r *http.Request) {
	var input models.UserAuthInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Проверяем телеграм данные и регистрируем/аутентифицируем пользователя
	authResponse, err := h.userService.LoginWithTelegram(r.Context(), &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Telegram authentication failed: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, authResponse)
}

// RefreshToken обновляет JWT токен
// @Summary Обновление токена
// @Description Обновляет токен доступа по refresh токену
// @Tags auth
// @Accept json
// @Produce json
// @Param input body models.RefreshTokenInput true "Refresh токен"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/auth/refresh [post]
func (h *UserHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var input models.RefreshTokenInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Обновляем токен
	tokenResponse, err := h.userService.RefreshToken(r.Context(), input.RefreshToken)
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Token refresh failed: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, tokenResponse)
}

// GetUserByID возвращает пользователя по ID (только для администраторов)
func (h *UserHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	// Проверка роли выполняется middleware AdminOnly

	// Получаем ID пользователя из URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Получаем данные пользователя
	user, err := h.repo.GetUserWithStats(id)
	if err != nil {
		http.Error(w, "Error getting user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Возвращаем данные пользователя
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetCurrentUser возвращает информацию о текущем пользователе
// @Summary Получение информации о текущем пользователе
// @Description Возвращает информацию о текущем пользователе
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {object} models.UserFullInfo
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/users/current [get]
func (h *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем полную информацию о пользователе
	userInfo, err := h.userService.GetUserFullInfo(r.Context(), userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get user info: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, userInfo)
}

// UpdateProfile обновляет профиль пользователя
// @Summary Обновление профиля пользователя
// @Description Обновляет профиль пользователя
// @Tags users
// @Accept json
// @Produce json
// @Param input body models.UserProfileUpdate true "Данные для обновления профиля"
// @Success 200 {object} models.UserFullInfo
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/users/profile [put]
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Декодируем данные для обновления профиля
	var input models.UserProfileUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Обновляем профиль
	updatedUser, err := h.userService.UpdateUserProfile(r.Context(), userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update profile: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedUser)
}

// RegisterDevice регистрирует устройство пользователя для push-уведомлений
// @Summary Регистрация устройства пользователя
// @Description Регистрирует устройство пользователя для получения push-уведомлений
// @Tags users
// @Accept json
// @Produce json
// @Param input body models.RegisterDeviceInput true "Данные устройства"
// @Success 200 {object} utils.SuccessResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/users/devices [post]
func (h *UserHandler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Декодируем данные устройства
	var input models.RegisterDeviceInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Регистрируем устройство
	err = h.userService.RegisterUserDevice(r.Context(), userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to register device: "+err.Error())
		return
	}

	utils.RespondWithSuccess(w, http.StatusOK, nil, "Device registered successfully")
}

// GetLeaderboard возвращает рейтинг пользователей
// @Summary Получение рейтинга пользователей
// @Description Возвращает список пользователей, отсортированных по рейтингу
// @Tags leaderboard
// @Accept json
// @Produce json
// @Param limit query int false "Количество пользователей в результате"
// @Param offset query int false "Смещение в результате"
// @Success 200 {object} models.LeaderboardResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/leaderboard [get]
func (h *UserHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	// Получаем параметры пагинации
	limit, offset := utils.PaginationParams(r, 10, 100)

	// Получаем рейтинг
	leaderboard, err := h.userService.GetLeaderboard(r.Context(), limit, offset)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get leaderboard: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, leaderboard)
}

// RegisterUserRoutes регистрирует маршруты для обработчиков пользователя
func (h *UserHandler) RegisterUserRoutes(r chi.Router) {
	r.Post("/auth/login", h.Login)
	r.Post("/auth/telegram", h.AuthWithTelegram)
	r.Post("/auth/refresh", h.RefreshToken)

	// Маршруты, требующие аутентификации
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(h.JWTSecret))
		r.Get("/users/current", h.GetCurrentUser)
		r.Put("/users/profile", h.UpdateProfile)
		r.Get("/leaderboard", h.GetLeaderboard)

		// Маршруты для администраторов
		r.Group(func(r chi.Router) {
			r.Use(middleware.AdminOnly)
			r.Get("/users/{id}", h.GetUserByID)
		})
	})
}

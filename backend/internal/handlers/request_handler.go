package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"moshosp/backend/internal/middleware"
	"github.com/sirupsen/logrus"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository"
	"moshosp/backend/internal/services"
	"moshosp/backend/internal/utils"
	"moshosp/backend/internal/database"
)

// RequestHandler обрабатывает запросы связанные с заявками на помощь
type RequestHandler struct {
	repo           *repository.Repository
	requestService *services.RequestService
	gameService    *services.GameService
	userService    *services.UserService
	logger         *logrus.Logger
}

// NewRequestHandler создает новый экземпляр обработчика запросов
func NewRequestHandler(repo *repository.Repository, requestService *services.RequestService, gameService *services.GameService, userService *services.UserService, logger *logrus.Logger) *RequestHandler {
	return &RequestHandler{
		repo:           repo,
		requestService: requestService,
		gameService:    gameService,
		userService:    userService,
		logger:         logger,
	}
}

// ListRequests возвращает список запросов с фильтрацией
func (h *RequestHandler) ListRequests(w http.ResponseWriter, r *http.Request) {
	// Получаем параметры фильтрации из query params
	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")

	// Получаем параметры пагинации
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 20 // По умолчанию 20 записей на страницу
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0 // По умолчанию начинаем с первой записи
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	// Фильтруем запросы
	requests, err := h.repo.GetHelpRequests(status, category, limit, offset)
	if err != nil {
		http.Error(w, "Ошибка получения запросов: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// GetRequest возвращает запрос по ID
func (h *RequestHandler) GetRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID запроса из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		http.Error(w, "Неверный ID запроса", http.StatusBadRequest)
		return
	}

	// Получаем запрос из БД
	request, err := h.repo.GetHelpRequestByID(requestID)
	if err != nil {
		http.Error(w, "Ошибка получения запроса: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if request == nil {
		http.Error(w, "Запрос не найден", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(request)
}

// CreateRequest создает новую заявку
// @Summary Создание новой заявки
// @Description Создает новую заявку на помощь
// @Tags requests
// @Accept json
// @Produce json
// @Param input body models.RequestCreateInput true "Данные заявки"
// @Success 201 {object} models.RequestFullInfo
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests [post]
func (h *RequestHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Декодируем данные заявки
	var input models.RequestCreateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Создаем заявку
	request, err := h.requestService.CreateRequest(r.Context(), userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create request: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, request)
}

// UpdateRequest обновляет заявку
// @Summary Обновить заявку
// @Description Обновляет заявку (доступно только создателю или волонтеру)
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param request body models.RequestUpdateInput true "Данные для обновления заявки"
// @Success 200 {object} models.HelpRequest
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id} [put]
func (h *RequestHandler) UpdateRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Проверяем, имеет ли пользователь доступ к заявке
	hasAccess, err := h.requestService.UserHasAccessToRequest(r.Context(), userID, requestID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to check access: "+err.Error())
		return
	}

	if !hasAccess {
		utils.RespondWithError(w, http.StatusForbidden, "You don't have permission to update this request")
		return
	}

	// Парсим тело запроса
	var input models.RequestUpdateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Обновляем заявку
	updatedRequest, err := h.requestService.UpdateRequest(r.Context(), requestID, userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update request: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedRequest)
}

// DeleteRequest удаляет запрос о помощи
func (h *RequestHandler) DeleteRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста (установлен middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Ошибка авторизации", http.StatusUnauthorized)
		return
	}

	// Получаем ID запроса из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		http.Error(w, "Неверный ID запроса", http.StatusBadRequest)
		return
	}

	// Получаем запрос для проверки прав
	request, err := h.repo.GetHelpRequestByID(requestID)
	if err != nil {
		http.Error(w, "Ошибка получения запроса: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if request == nil {
		http.Error(w, "Запрос не найден", http.StatusNotFound)
		return
	}

	// Проверяем права доступа (только создатель или админ могут удалять)
	user, err := h.repo.GetUserByID(int(userID))
	if err != nil {
		http.Error(w, "Ошибка получения пользователя: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if request.RequesterID != int(userID) && user.Role != "admin" {
		http.Error(w, "Недостаточно прав для удаления запроса", http.StatusForbidden)
		return
	}

	// Удаляем запрос
	if err := h.repo.DeleteHelpRequest(requestID); err != nil {
		http.Error(w, "Ошибка удаления запроса: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Возвращаем успешный статус
	w.WriteHeader(http.StatusNoContent)
}

// AssignRequest назначает волонтера на запрос
func (h *RequestHandler) AssignRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста (установлен middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Ошибка авторизации", http.StatusUnauthorized)
		return
	}

	// Получаем ID запроса из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		http.Error(w, "Неверный ID запроса", http.StatusBadRequest)
		return
	}

	// Проверяем, что пользователь является волонтером или админом
	user, err := h.repo.GetUserByID(int(userID))
	if err != nil {
		http.Error(w, "Ошибка получения пользователя: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "Пользователь не найден", http.StatusUnauthorized)
		return
	}

	if user.Role != "volunteer" && user.Role != "admin" {
		http.Error(w, "Только волонтеры могут брать запросы на выполнение", http.StatusForbidden)
		return
	}

	// Получаем запрос из БД
	request, err := h.repo.GetHelpRequestByID(requestID)
	if err != nil {
		http.Error(w, "Ошибка получения запроса: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if request == nil {
		http.Error(w, "Запрос не найден", http.StatusNotFound)
		return
	}

	// Проверяем, что запрос находится в статусе "новый"
	if request.Status != "new" {
		http.Error(w, "Запрос уже взят в работу или выполнен", http.StatusBadRequest)
		return
	}

	// Назначаем запрос волонтеру
	volunteerId := int(userID)
	status := "in_progress"

	updateParams := database.RequestUpdateParams{
		Status:     &status,
		AssignedTo: &volunteerId,
	}

	if err := h.repo.UpdateHelpRequest(requestID, &updateParams); err != nil {
		http.Error(w, "Ошибка назначения запроса: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Получаем обновленный запрос
	updatedRequest, err := h.repo.GetHelpRequestByID(requestID)
	if err != nil {
		http.Error(w, "Запрос назначен, но возникла ошибка при его получении", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedRequest)
}

// CompleteRequest отмечает заявку как выполненную
// @Summary Завершить заявку
// @Description Отмечает заявку как выполненную
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} models.HelpRequest
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/complete [post]
func (h *RequestHandler) CompleteRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Проверяем, имеет ли пользователь доступ к заявке
	hasAccess, err := h.requestService.UserHasAccessToRequest(r.Context(), userID, requestID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to check access: "+err.Error())
		return
	}

	if !hasAccess {
		utils.RespondWithError(w, http.StatusForbidden, "You don't have permission to complete this request")
		return
	}

	// Завершаем заявку
	completedRequest, err := h.requestService.CompleteRequest(r.Context(), requestID, userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to complete request: "+err.Error())
		return
	}

	// Добавляем опыт волонтеру за выполнение заявки
	if completedRequest.VolunteerID != nil {
		_, err = h.gameService.AddExperience(r.Context(), *completedRequest.VolunteerID, 50)
		if err != nil {
			// Логируем ошибку, но не прерываем выполнение
			// TODO: добавить логирование
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, completedRequest)
}

// AcceptRequest принимает заявку волонтером
// @Summary Принять заявку
// @Description Волонтер принимает заявку на выполнение
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} models.HelpRequest
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/accept [post]
func (h *RequestHandler) AcceptRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Проверяем, что пользователь является волонтером
	userRole, err := utils.GetUserRoleFromContext(r.Context())
	if err != nil || (userRole != "volunteer" && userRole != "admin") {
		utils.RespondWithError(w, http.StatusForbidden, "Only volunteers can accept requests")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Принимаем заявку
	updatedRequest, err := h.requestService.AcceptRequest(r.Context(), requestID, userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to accept request: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedRequest)
}

// CancelRequest отменяет заявку
// @Summary Отмена заявки
// @Description Отменяет заявку (доступно создателю заявки или волонтеру)
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} models.RequestFullInfo
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id} [delete]
func (h *RequestHandler) CancelRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Отменяем заявку
	request, err := h.requestService.CancelRequest(r.Context(), requestID, userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to cancel request: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, request)
}

// AddRequestComment добавляет комментарий к заявке
// @Summary Добавить комментарий
// @Description Добавляет комментарий к заявке
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param comment body models.RequestCommentInput true "Данные комментария"
// @Success 201 {object} models.RequestComment
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/comments [post]
func (h *RequestHandler) AddRequestComment(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Проверяем, имеет ли пользователь доступ к заявке
	hasAccess, err := h.requestService.UserHasAccessToRequest(r.Context(), userID, requestID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to check access: "+err.Error())
		return
	}

	if !hasAccess {
		utils.RespondWithError(w, http.StatusForbidden, "You don't have permission to comment on this request")
		return
	}

	// Парсим тело запроса
	var input models.RequestCommentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Добавляем комментарий
	comment, err := h.requestService.AddRequestComment(r.Context(), requestID, userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to add comment: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, comment)
}

// GetAllRequests получает список всех заявок с пагинацией и фильтрацией
// @Summary Получить все заявки
// @Description Возвращает список всех заявок с возможностью фильтрации и пагинацией
// @Tags requests
// @Accept json
// @Produce json
// @Param status query string false "Статус заявки (open, in_progress, completed, cancelled)"
// @Param category query string false "Категория заявки"
// @Param priority query string false "Приоритет заявки (low, medium, high)"
// @Param limit query int false "Лимит количества записей" default(10)
// @Param offset query int false "Смещение для пагинации" default(0)
// @Success 200 {object} models.PaginatedResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests [get]
func (h *RequestHandler) GetAllRequests(w http.ResponseWriter, r *http.Request) {
	// Получаем параметры запроса
	limit, offset := utils.PaginationParams(r, 10, 100)

	// Фильтры
	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")
	priority := r.URL.Query().Get("priority")

	// Получаем список заявок
	requests, total, err := h.requestService.GetRequests(r.Context(), limit, offset, status, category, priority)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get requests: "+err.Error())
		return
	}

	// Формируем ответ с пагинацией
	totalPages := total / limit
	if total%limit > 0 {
		totalPages++
	}

	response := models.PaginatedResponse{
		Items:      requests,
		TotalItems: total,
		TotalPages: totalPages,
		Page:       offset/limit + 1,
		PageSize:   limit,
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

// GetRequestByID получает заявку по ID
// @Summary Получить заявку по ID
// @Description Возвращает полную информацию о заявке по ее ID
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} models.RequestFullInfo
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id} [get]
func (h *RequestHandler) GetRequestByID(w http.ResponseWriter, r *http.Request) {
	// Получаем ID заявки из URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Получаем информацию о заявке
	request, err := h.requestService.GetRequestByID(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, http.StatusNotFound, "Request not found")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, request)
}

// GetRequestCategories возвращает список доступных категорий заявок
// @Summary Получение категорий заявок
// @Description Возвращает список всех доступных категорий заявок
// @Tags requests
// @Accept json
// @Produce json
// @Success 200 {array} models.RequestCategory
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/categories [get]
func (h *RequestHandler) GetRequestCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.requestService.GetRequestCategories()
	if err != nil {
		h.logger.WithError(err).Error("Failed to get request categories")
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get request categories", err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, categories)
}

// GetUserRequests получает список заявок текущего пользователя
// @Summary Получить запросы пользователя
// @Description Получает список запросов, созданных текущим авторизованным пользователем
// @Tags requests
// @Accept json
// @Produce json
// @Param status query string false "Статус запроса"
// @Param page query int false "Номер страницы"
// @Param limit query int false "Количество элементов на странице"
// @Success 200 {object} models.PaginatedResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Security BearerAuth
// @Router /api/users/me/requests [get]
func (h *RequestHandler) GetUserRequests(w http.ResponseWriter, r *http.Request) {
	// Получение ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized", err.Error())
		return
	}

	// Получение параметров запроса
	status := r.URL.Query().Get("status")

	// Получение параметров пагинации с дефолтными значениями
	page := 1
	limit := 10

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if pageVal, err := strconv.Atoi(pageStr); err == nil && pageVal > 0 {
			page = pageVal
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limitVal, err := strconv.Atoi(limitStr); err == nil && limitVal > 0 {
			limit = limitVal
		}
	}

	// Получение списка запросов пользователя через сервис
	requests, total, err := h.requestService.GetUserRequests(userID, status, page, limit)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user requests")
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get user requests", err.Error())
		return
	}

	// Формирование ответа с пагинацией
	response := models.PaginatedResponse{
		Data:       requests,
		TotalItems: total,
		Page:       page,
		Limit:      limit,
		TotalPages: (total + limit - 1) / limit,
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

// RateRequest добавляет оценку выполненной заявке
// @Summary Оценка выполненной заявки
// @Description Добавляет оценку выполненной заявке (доступно только создателю заявки)
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param rating body models.RequestRatingInput true "Данные оценки"
// @Success 201 {object} models.RequestRating
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/rating [post]
func (h *RequestHandler) RateRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Декодируем тело запроса
	var input models.RequestRatingInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Валидация рейтинга
	if input.Rating < 1 || input.Rating > 5 {
		utils.RespondWithError(w, http.StatusBadRequest, "Rating should be between 1 and 5")
		return
	}

	// Добавляем оценку
	rating, err := h.requestService.RateRequest(r.Context(), requestID, userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to rate request: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, rating)
}

// GetRequestStats получает статистику по запросам
// @Summary Получить статистику запросов
// @Description Получает статистические данные по всем запросам
// @Tags requests
// @Accept json
// @Produce json
// @Success 200 {object} models.RequestStats
// @Failure 500 {object} models.ErrorResponse
// @Router /api/requests/stats [get]
func (h *RequestHandler) GetRequestStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.requestService.GetRequestStats()
	if err != nil {
		h.logger.WithError(err).Error("Failed to get request stats")
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get request stats", err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, stats)
}

// GetRequestComments возвращает комментарии к заявке
// @Summary Получение комментариев к заявке
// @Description Возвращает список комментариев к заявке
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param page query int false "Номер страницы"
// @Param limit query int false "Количество комментариев на странице"
// @Success 200 {object} models.PaginatedResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/comments [get]
func (h *RequestHandler) GetRequestComments(w http.ResponseWriter, r *http.Request) {
	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Получаем параметры пагинации
	limit, offset := utils.PaginationParams(r, 10, 100)
	page := 1
	if offset > 0 {
		page = (offset / limit) + 1
	}

	// Создаем фильтр
	filter := models.RequestFilter{
		Limit:  limit,
		Offset: offset,
	}

	// Получаем комментарии
	comments, totalCount, err := h.requestService.GetRequestComments(r.Context(), requestID, filter)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get comments: "+err.Error())
		return
	}

	// Возвращаем результат
	response := models.PaginatedResponse{
		Items:      comments,
		TotalItems: totalCount,
		TotalPages: (totalCount + limit - 1) / limit,
		Page:       page,
		PageSize:   limit,
	}
	utils.RespondWithJSON(w, http.StatusOK, response)
}

// AddComment добавляет комментарий к заявке
// @Summary Добавление комментария к заявке
// @Description Добавляет комментарий к заявке (доступно создателю и волонтеру)
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param comment body models.RequestCommentInput true "Текст комментария"
// @Success 201 {object} models.RequestComment
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/comments [post]
func (h *RequestHandler) AddComment(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Декодируем тело запроса
	var input models.RequestCommentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Добавляем комментарий
	comment, err := h.requestService.AddComment(r.Context(), requestID, userID, &input)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to add comment: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, comment)
}

// TakeRequest позволяет волонтеру взять заявку на выполнение
// @Summary Взятие заявки волонтером
// @Description Волонтер берет заявку на выполнение
// @Tags requests
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} models.RequestFullInfo
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests/{id}/take [post]
func (h *RequestHandler) TakeRequest(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Получаем ID заявки из URL
	requestIDStr := chi.URLParam(r, "id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	// Берем заявку на выполнение
	request, err := h.requestService.TakeRequest(r.Context(), requestID, userID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to take request: "+err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, request)
}

// RegisterRequestRoutes регистрирует маршруты для обработчика заявок
func RegisterRequestRoutes(r chi.Router, h *RequestHandler) {
	// Публичные маршруты
	r.Group(func(r chi.Router) {
		r.Get("/api/requests/categories", h.GetRequestCategories)
		r.Get("/api/requests/stats", h.GetRequestStats)
	})

	// Маршруты, требующие аутентификации
	r.Group(func(r chi.Router) {
		r.Get("/api/requests", h.GetAllRequests)
		r.Post("/api/requests", h.CreateRequest)
		r.Get("/api/requests/user", h.GetUserRequests)
		r.Get("/api/requests/{id}", h.GetRequestByID)
		r.Put("/api/requests/{id}", h.UpdateRequest)
		r.Post("/api/requests/{id}/accept", h.AcceptRequest)
		r.Post("/api/requests/{id}/complete", h.CompleteRequest)
		r.Post("/api/requests/{id}/cancel", h.CancelRequest)
		r.Get("/api/requests/{id}/comments", h.GetRequestComments)
		r.Post("/api/requests/{id}/comments", h.AddRequestComment)
		r.Post("/api/requests/{id}/rate", h.RateRequest)
		r.Post("/api/requests/{id}/take", h.TakeRequest)
	})
}

// GetRequests возвращает список заявок с фильтрацией и пагинацией
// @Summary Получение списка заявок
// @Description Возвращает список заявок с возможностью фильтрации и пагинации
// @Tags requests
// @Accept json
// @Produce json
// @Param status query string false "Статус заявки"
// @Param category query string false "Категория заявки"
// @Param page query int false "Номер страницы"
// @Param limit query int false "Количество заявок на странице"
// @Success 200 {object} models.PaginatedResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/requests [get]
func (h *RequestHandler) GetRequests(w http.ResponseWriter, r *http.Request) {
	// Получаем параметры пагинации
	limit, offset := utils.PaginationParams(r, 10, 100)
	page := 1
	if offset > 0 {
		page = (offset / limit) + 1
	}

	// Получаем параметры фильтрации
	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")

	// Получаем ID пользователя из контекста (если есть)
	userID, _ := utils.GetUserIDFromContext(r.Context())

	// Создаем фильтр
	filter := models.RequestFilter{
		Status:   status,
		Category: category,
		UserID:   userID,
		Limit:    limit,
		Offset:   offset,
	}

	// Получаем заявки
	requests, totalCount, err := h.requestService.GetRequests(r.Context(), filter)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get requests: "+err.Error())
		return
	}

	// Возвращаем результат
	response := models.PaginatedResponse{
		Items:      requests,
		TotalItems: totalCount,
		TotalPages: (totalCount + limit - 1) / limit,
		Page:       page,
		PageSize:   limit,
	}
	utils.RespondWithJSON(w, http.StatusOK, response)
}

// GetVolunteerRequests получает список заявок, взятых текущим волонтером
// @Summary Получить запросы волонтера
// @Description Получает список запросов, взятых текущим авторизованным волонтером
// @Tags requests
// @Accept json
// @Produce json
// @Param status query string false "Статус запроса"
// @Param page query int false "Номер страницы"
// @Param limit query int false "Количество элементов на странице"
// @Success 200 {object} models.PaginatedResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Security BearerAuth
// @Router /api/users/me/volunteer-requests [get]
func (h *RequestHandler) GetVolunteerRequests(w http.ResponseWriter, r *http.Request) {
	// Получение ID пользователя из контекста
	userID, err := utils.GetUserIDFromContext(r.Context())
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized", err.Error())
		return
	}

	// Проверка, что пользователь является волонтером
	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user")
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get user", err.Error())
		return
	}

	if user.Role != models.UserRoleVolunteer && user.Role != models.UserRoleAdmin {
		utils.RespondWithError(w, http.StatusForbidden, "Only volunteers can access this resource", "")
		return
	}

	// Получение параметров запроса
	status := r.URL.Query().Get("status")

	// Получение параметров пагинации с дефолтными значениями
	page := 1
	limit := 10

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if pageVal, err := strconv.Atoi(pageStr); err == nil && pageVal > 0 {
			page = pageVal
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limitVal, err := strconv.Atoi(limitStr); err == nil && limitVal > 0 {
			limit = limitVal
		}
	}

	// Получение списка запросов волонтера через сервис
	requests, total, err := h.requestService.GetVolunteerRequests(userID, status, page, limit)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get volunteer requests")
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get volunteer requests", err.Error())
		return
	}

	// Формирование ответа с пагинацией
	response := models.PaginatedResponse{
		Data:       requests,
		TotalItems: total,
		Page:       page,
		Limit:      limit,
		TotalPages: (total + limit - 1) / limit,
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

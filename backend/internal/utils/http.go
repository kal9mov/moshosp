package utils

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"moshosp/backend/internal/middleware"
)

// ErrorResponse представляет структуру ответа с ошибкой
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// SuccessResponse представляет структуру успешного ответа
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// RespondWithError отправляет клиенту ответ с ошибкой в формате JSON
func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, ErrorResponse{
		Error:   http.StatusText(code),
		Message: message,
		Code:    code,
	})
}

// RespondWithJSON отправляет клиенту ответ в формате JSON
func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"Internal Server Error","message":"Error marshaling JSON response","code":500}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// RespondWithSuccess отправляет клиенту успешный ответ в формате JSON
func RespondWithSuccess(w http.ResponseWriter, code int, data interface{}, message string) {
	RespondWithJSON(w, code, SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// GetUserIDFromContext извлекает ID пользователя из контекста запроса
func GetUserIDFromContext(ctx context.Context) (int, error) {
	userID, ok := ctx.Value(middleware.UserIDKey).(string)
	if !ok {
		return 0, errors.New("user ID not found in context")
	}

	// Преобразуем строковый ID в int
	id, err := strconv.Atoi(userID)
	if err != nil {
		return 0, errors.New("invalid user ID format")
	}

	return id, nil
}

// GetUserRoleFromContext извлекает роль пользователя из контекста запроса
func GetUserRoleFromContext(ctx context.Context) (string, error) {
	role, ok := ctx.Value(middleware.UserRoleKey).(string)
	if !ok {
		return "", errors.New("user role not found in context")
	}
	return role, nil
}

// PaginationParams извлекает и проверяет параметры пагинации из запроса
func PaginationParams(r *http.Request, defaultLimit, maxLimit int) (limit, offset int) {
	// Получаем параметр limit из запроса
	limitStr := r.URL.Query().Get("limit")
	limit = defaultLimit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Ограничиваем максимальный размер страницы
	if limit > maxLimit {
		limit = maxLimit
	}

	// Получаем параметр offset или page из запроса
	offsetStr := r.URL.Query().Get("offset")
	pageStr := r.URL.Query().Get("page")

	offset = 0
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	} else if pageStr != "" {
		// Если указан номер страницы, вычисляем смещение
		page, err := strconv.Atoi(pageStr)
		if err == nil && page > 0 {
			offset = (page - 1) * limit
		}
	}

	return limit, offset
}

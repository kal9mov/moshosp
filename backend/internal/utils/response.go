package utils

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
)

// ErrorResponse структура для ответа с ошибкой
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}

// StatusResponse структура для ответа со статусом
type StatusResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// RespondWithError отправляет ответ с ошибкой
func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, ErrorResponse{
		Error:   http.StatusText(code),
		Message: message,
		Code:    code,
	})
}

// RespondWithJSON отправляет JSON-ответ
func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		// Логируем ошибку, но не паникуем
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"Internal Server Error","message":"Failed to encode response","code":500}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// GetUserIDFromContext извлекает ID пользователя из контекста
func GetUserIDFromContext(ctx context.Context) (int, error) {
	userID, ok := ctx.Value("user_id").(int)
	if !ok {
		return 0, errors.New("user ID not found in context")
	}
	return userID, nil
}

// GetUserRoleFromContext извлекает роль пользователя из контекста
func GetUserRoleFromContext(ctx context.Context) (string, error) {
	userRole, ok := ctx.Value("user_role").(string)
	if !ok {
		return "", errors.New("user role not found in context")
	}
	return userRole, nil
}

// GetUserIDFromRequest извлекает ID пользователя из URL-параметра
func GetUserIDFromRequest(r *http.Request, paramName string) (int, error) {
	userIDStr := r.URL.Query().Get(paramName)
	if userIDStr == "" {
		return 0, errors.New("user ID parameter is required")
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		return 0, errors.New("invalid user ID format")
	}

	return userID, nil
}

// PaginationParams извлекает параметры пагинации из запроса
func PaginationParams(r *http.Request, defaultLimit, maxLimit int) (limit, offset int) {
	limit = defaultLimit
	offset = 0

	limitStr := r.URL.Query().Get("limit")
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Ограничиваем максимальное значение limit
	if limit > maxLimit {
		limit = maxLimit
	}

	offsetStr := r.URL.Query().Get("offset")
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	return limit, offset
}

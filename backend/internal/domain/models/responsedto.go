package models

import (
	"encoding/json"
	"net/http"
)

// PaginatedResponse представляет ответ с пагинацией
type PaginatedResponse struct {
	Items      interface{} `json:"items"`
	TotalItems int         `json:"total_items"`
	TotalPages int         `json:"total_pages"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
}

// APIErrorResponse представляет стандартизированный ответ с ошибкой
type APIErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}

// APISuccessResponse представляет стандартизированный успешный ответ
type APISuccessResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// LoginResponse представляет ответ на успешную аутентификацию
type LoginResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// StatsResponse представляет ответ со статистикой системы
type StatsResponse struct {
	UserCount         int `json:"user_count"`
	VolunteerCount    int `json:"volunteer_count"`
	RequestCount      int `json:"request_count"`
	CompletedRequests int `json:"completed_requests"`
	AchievementCount  int `json:"achievement_count"`
}

// DeviceRegistrationResponse представляет ответ на регистрацию устройства
type DeviceRegistrationResponse struct {
	Status         string `json:"status"`
	DeviceID       string `json:"device_id"`
	SubscriptionID string `json:"subscription_id"`
}

// WriteJSON записывает в ответ данные в формате JSON
func WriteJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	// Устанавливаем заголовок Content-Type
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	// Сериализуем данные в JSON
	if err := json.NewEncoder(w).Encode(data); err != nil {
		// В случае ошибки сериализации отправляем простой текстовый ответ
		http.Error(w, "Ошибка формирования JSON ответа", http.StatusInternalServerError)
	}
}

// WriteError записывает в ответ ошибку в формате JSON
func WriteError(w http.ResponseWriter, errorMessage string, statusCode int) {
	response := APIErrorResponse{
		Error: errorMessage,
	}
	WriteJSON(w, response, statusCode)
}

// WriteSuccess записывает в ответ успешный результат в формате JSON
func WriteSuccess(w http.ResponseWriter, message string, statusCode int) {
	response := APISuccessResponse{
		Status:  "success",
		Message: message,
	}
	WriteJSON(w, response, statusCode)
}

// WritePaginated записывает в ответ данные с пагинацией
func WritePaginated(w http.ResponseWriter, data interface{}, totalCount, page, pageSize int) {
	response := PaginatedResponse{
		Items:      data,
		TotalItems: totalCount,
		TotalPages: (totalCount + pageSize - 1) / pageSize,
		Page:       page,
		PageSize:   pageSize,
	}
	WriteJSON(w, response, http.StatusOK)
}

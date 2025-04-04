package models

// RefreshTokenInput представляет запрос на обновление токена
type RefreshTokenInput struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// MarkNotificationReadInput представляет запрос на пометку уведомления как прочитанного
type MarkNotificationReadInput struct {
	NotificationID string `json:"notification_id" validate:"required"`
}

// RegisterDeviceInput представляет запрос на регистрацию устройства для пуш-уведомлений
type RegisterDeviceInput struct {
	DeviceToken string `json:"device_token" validate:"required"`
	DeviceType  string `json:"device_type" validate:"required,oneof=ios android web"`
}

// ErrorResponse представляет стандартный формат ответа с ошибкой
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}

// StatusResponse представляет стандартный формат ответа со статусом
type StatusResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

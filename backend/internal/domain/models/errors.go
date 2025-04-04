package models

import "errors"

// Ошибки приложения
var (
	// ErrNotFound представляет ошибку, когда ресурс не найден
	ErrNotFound = errors.New("resource not found")

	// ErrForbidden представляет ошибку, когда у пользователя нет прав для выполнения операции
	ErrForbidden = errors.New("forbidden")

	// ErrUnauthorized представляет ошибку, когда пользователь не авторизован
	ErrUnauthorized = errors.New("unauthorized")

	// ErrConflict представляет ошибку конфликта данных
	ErrConflict = errors.New("conflict")

	// ErrInvalidRequest представляет ошибку некорректного запроса
	ErrInvalidRequest = errors.New("invalid request")

	// ErrInternalError представляет внутреннюю ошибку сервера
	ErrInternalError = errors.New("internal server error")
)

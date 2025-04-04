package repository

import (
	"errors"
)

// Ошибки репозитория
var (
	// ErrNotFound возникает, когда запрашиваемый ресурс не найден
	ErrNotFound = errors.New("resource not found")

	// ErrConflict возникает при конфликте ресурсов (например, при дублировании уникальных ключей)
	ErrConflict = errors.New("resource conflict")

	// ErrInvalidData возникает при попытке сохранить некорректные данные
	ErrInvalidData = errors.New("invalid data")

	// ErrInternalError возникает при внутренних ошибках репозитория
	ErrInternalError = errors.New("internal repository error")
)

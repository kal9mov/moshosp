package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
)

// Определим интерфейсы вместо прямого импорта реализаций

// GameRepository интерфейс для работы с игровыми данными
type GameRepository interface {
	// Здесь можно определить методы интерфейса GameRepository,
	// но для решения проблемы с циклическими зависимостями достаточно определить тип
}

// UserRepository интерфейс для работы с пользователями
type UserRepository interface {
	// Здесь можно определить методы интерфейса UserRepository,
	// но для решения проблемы с циклическими зависимостями достаточно определить тип
}

// RequestRepository интерфейс для работы с запросами
type RequestRepository interface {
	// Здесь можно определить методы интерфейса RequestRepository,
	// но для решения проблемы с циклическими зависимостями достаточно определить тип
}

// Repository представляет собой контейнер для всех репозиториев
type Repository struct {
	User    interface{} // UserRepository
	Game    interface{} // GameRepository
	Request interface{} // RequestRepository
}

// NewRepository создает новый экземпляр репозитория
// Этот конструктор будет обновлен в main.go для использования
// конкретных типов репозиториев
func NewRepository(db *sqlx.DB, logger *logrus.Logger) *Repository {
	return &Repository{}
}

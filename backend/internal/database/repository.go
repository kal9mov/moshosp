// This file is intentionally left empty
// The content has been moved to the appropriate files in the package

package database

import (
	"github.com/jmoiron/sqlx"
)

// Repository предоставляет методы для работы с базой данных
type Repository struct {
	db *sqlx.DB
}

// NewRepository создает новый экземпляр репозитория
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		db: db,
	}
}

// GetDB возвращает используемое соединение с базой данных
func (r *Repository) GetDB() *sqlx.DB {
	return r.db
}

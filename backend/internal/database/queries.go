package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

// Repository представляет интерфейс для работы с базой данных
type Repository struct {
	db *sqlx.DB
}

// NewRepository создает новый репозиторий для работы с БД
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		db: db,
	}
}

// ===== Методы для работы с пользователями =====

// GetUserByID получает пользователя по ID
func (r *Repository) GetUserByID(id int) (*User, error) {
	var user User
	query := `
		SELECT id, telegram_id, username, first_name, last_name, photo_url, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	err := r.db.Get(&user, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByTelegramID получает пользователя по Telegram ID
func (r *Repository) GetUserByTelegramID(telegramID string) (*User, error) {
	var user User
	query := `
		SELECT id, telegram_id, username, first_name, last_name, photo_url, role, created_at, updated_at
		FROM users
		WHERE telegram_id = $1
	`
	err := r.db.Get(&user, query, telegramID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateUser создает нового пользователя
func (r *Repository) CreateUser(user *User) error {
	query := `
		INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	// Если роль не указана, устанавливаем "user"
	if user.Role == "" {
		user.Role = "user"
	}

	err := r.db.QueryRow(query,
		user.TelegramID,
		user.Username,
		user.FirstName,
		user.LastName,
		user.PhotoURL,
		user.Role,
		user.CreatedAt,
		user.UpdatedAt,
	).Scan(&user.ID)

	return err
}

// UpdateUser обновляет данные пользователя
func (r *Repository) UpdateUser(id int, params *UserUpdateParams) error {
	// Строим динамический запрос для обновления
	query := "UPDATE users SET updated_at = now()"
	args := []interface{}{}
	argCount := 1

	// Добавляем только те поля, которые не равны nil
	username := sql.NullString{}
	if params.Username != nil {
		query += fmt.Sprintf(", username = $%d", argCount)
		username.String = *params.Username
		username.Valid = true
		args = append(args, username)
		argCount++
	}

	firstName := sql.NullString{}
	if params.FirstName != nil {
		query += fmt.Sprintf(", first_name = $%d", argCount)
		firstName.String = *params.FirstName
		firstName.Valid = true
		args = append(args, firstName)
		argCount++
	}

	lastName := sql.NullString{}
	if params.LastName != nil {
		query += fmt.Sprintf(", last_name = $%d", argCount)
		lastName.String = *params.LastName
		lastName.Valid = true
		args = append(args, lastName)
		argCount++
	}

	photoURL := sql.NullString{}
	if params.PhotoURL != nil {
		query += fmt.Sprintf(", photo_url = $%d", argCount)
		photoURL.String = *params.PhotoURL
		photoURL.Valid = true
		args = append(args, photoURL)
		argCount++
	}

	if params.Role != nil {
		query += fmt.Sprintf(", role = $%d", argCount)
		args = append(args, *params.Role)
		argCount++
	}

	// Завершаем запрос
	query += fmt.Sprintf(" WHERE id = $%d", argCount)
	args = append(args, id)

	// Выполняем запрос
	_, err := r.db.Exec(query, args...)
	return err
}

// GetUserWithStats получает пользователя вместе с его статистикой
func (r *Repository) GetUserWithStats(id int) (*User, error) {
	user, err := r.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}

	// Получаем статистику
	stats, err := r.GetUserStats(id)
	if err != nil {
		return nil, err
	}

	user.Stats = stats
	return user, nil
}

// ===== Методы для работы со статистикой пользователей =====

// GetUserStats получает статистику пользователя
func (r *Repository) GetUserStats(userID int) (*UserStats, error) {
	var stats UserStats
	query := `
		SELECT id, user_id, level, experience, completed_requests, created_requests, volunteer_hours, 
		       rating, created_at, updated_at
		FROM user_stats
		WHERE user_id = $1
	`
	err := r.db.Get(&stats, query, userID)
	if err == sql.ErrNoRows {
		// Если статистика не найдена, создаем новую запись
		stats = UserStats{
			UserID:            userID,
			Level:             1,
			Experience:        0,
			CompletedRequests: 0,
			CreatedRequests:   0,
			VolunteerHours:    0,
			Rating:            5.0,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}
		err = r.CreateUserStats(&stats)
		if err != nil {
			return nil, err
		}
		return &stats, nil
	}
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

// CreateUserStats создает запись о статистике пользователя
func (r *Repository) CreateUserStats(stats *UserStats) error {
	query := `
		INSERT INTO user_stats (user_id, level, experience, completed_requests, created_requests, 
		                        volunteer_hours, rating, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`

	now := time.Now()
	if stats.CreatedAt.IsZero() {
		stats.CreatedAt = now
	}
	if stats.UpdatedAt.IsZero() {
		stats.UpdatedAt = now
	}

	err := r.db.QueryRow(query,
		stats.UserID,
		stats.Level,
		stats.Experience,
		stats.CompletedRequests,
		stats.CreatedRequests,
		stats.VolunteerHours,
		stats.Rating,
		stats.CreatedAt,
		stats.UpdatedAt,
	).Scan(&stats.ID)

	return err
}

// UpdateUserStats обновляет статистику пользователя
func (r *Repository) UpdateUserStats(stats *UserStats) error {
	query := `
		UPDATE user_stats 
		SET level = $1, experience = $2, completed_requests = $3, created_requests = $4,
		    volunteer_hours = $5, rating = $6, updated_at = $7
		WHERE user_id = $8
	`

	stats.UpdatedAt = time.Now()

	_, err := r.db.Exec(query,
		stats.Level,
		stats.Experience,
		stats.CompletedRequests,
		stats.CreatedRequests,
		stats.VolunteerHours,
		stats.Rating,
		stats.UpdatedAt,
		stats.UserID,
	)

	return err
}

// AddExperience добавляет опыт пользователю и обновляет уровень
func (r *Repository) AddExperience(userID int, expPoints int) error {
	// Получаем текущую статистику пользователя
	stats, err := r.GetUserStats(userID)
	if err != nil {
		return err
	}

	// Добавляем опыт
	stats.Experience += expPoints

	// Рассчитываем новый уровень (простая формула: каждые 100 очков опыта = новый уровень)
	newLevel := (stats.Experience / 100) + 1
	if newLevel > stats.Level {
		stats.Level = newLevel
	}

	// Обновляем статистику в БД
	stats.UpdatedAt = time.Now()
	return r.UpdateUserStats(stats)
}

// ===== Методы для работы с запросами помощи =====

// CreateHelpRequest создает новый запрос о помощи
func (r *Repository) CreateHelpRequest(params *RequestCreateParams) (*HelpRequest, error) {
	query := `
		INSERT INTO help_requests (title, description, category, priority, location, requester_id, 
		                          status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, 'new', now(), now())
		RETURNING id, title, description, category, priority, location, requester_id, 
		          status, created_at, updated_at
	`

	// Устанавливаем приоритет по умолчанию, если он не указан
	priority := "medium"
	if params.Priority != "" {
		priority = params.Priority
	}

	var request HelpRequest
	err := r.db.QueryRow(query,
		params.Title,
		params.Description,
		params.Category,
		priority,
		params.Location,
		params.RequesterID,
	).Scan(
		&request.ID,
		&request.Title,
		&request.Description,
		&request.Category,
		&request.Priority,
		&request.Location,
		&request.RequesterID,
		&request.Status,
		&request.CreatedAt,
		&request.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Обновляем статистику пользователя
	stats, err := r.GetUserStats(params.RequesterID)
	if err != nil {
		// Не критическая ошибка, логируем и продолжаем
		fmt.Printf("Error getting user stats: %v\n", err)
	} else {
		stats.CreatedRequests++
		if err := r.UpdateUserStats(stats); err != nil {
			fmt.Printf("Error updating user stats: %v\n", err)
		}
	}

	return &request, nil
}

// GetHelpRequests получает список запросов с фильтрацией
func (r *Repository) GetHelpRequests(status, category string, limit, offset int) ([]*HelpRequest, error) {
	query := `
		SELECT id, title, description, status, category, priority, location, requester_id, 
		       assigned_to, created_at, updated_at, completed_at
		FROM help_requests
		WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	// Добавляем фильтры
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, status)
		argCount++
	}

	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argCount)
		args = append(args, category)
		argCount++
	}

	// Добавляем сортировку, пагинацию
	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, offset)

	// Выполняем запрос
	rows, err := r.db.Queryx(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Обрабатываем результаты
	var requests []*HelpRequest
	for rows.Next() {
		var req HelpRequest
		if err := rows.StructScan(&req); err != nil {
			return nil, err
		}
		requests = append(requests, &req)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return requests, nil
}

// GetHelpRequestByID получает запрос по его ID
func (r *Repository) GetHelpRequestByID(id int) (*HelpRequest, error) {
	query := `
		SELECT id, title, description, status, category, priority, location, requester_id, 
		       assigned_to, created_at, updated_at, completed_at
		FROM help_requests
		WHERE id = $1
	`

	var request HelpRequest
	err := r.db.Get(&request, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Получаем информацию о создателе запроса
	requester, err := r.GetUserByID(request.RequesterID)
	if err == nil && requester != nil {
		request.Requester = requester
	}

	// Получаем информацию о назначенном волонтере, если есть
	if request.AssignedTo != nil {
		volunteer, err := r.GetUserByID(*request.AssignedTo)
		if err == nil && volunteer != nil {
			request.Volunteer = volunteer
		}
	}

	return &request, nil
}

// UpdateHelpRequest обновляет запрос о помощи
func (r *Repository) UpdateHelpRequest(id int, params *RequestUpdateParams) error {
	// Строим динамический запрос для обновления
	query := "UPDATE help_requests SET updated_at = now()"
	args := []interface{}{}
	argCount := 1

	// Добавляем только те поля, которые не равны nil
	if params.Title != nil {
		query += fmt.Sprintf(", title = $%d", argCount)
		args = append(args, *params.Title)
		argCount++
	}

	if params.Description != nil {
		query += fmt.Sprintf(", description = $%d", argCount)
		args = append(args, *params.Description)
		argCount++
	}

	if params.Status != nil {
		query += fmt.Sprintf(", status = $%d", argCount)
		args = append(args, *params.Status)
		argCount++
	}

	if params.Category != nil {
		query += fmt.Sprintf(", category = $%d", argCount)
		args = append(args, *params.Category)
		argCount++
	}

	if params.Priority != nil {
		query += fmt.Sprintf(", priority = $%d", argCount)
		args = append(args, *params.Priority)
		argCount++
	}

	if params.Location != nil {
		query += fmt.Sprintf(", location = $%d", argCount)
		args = append(args, *params.Location)
		argCount++
	}

	if params.AssignedTo != nil {
		query += fmt.Sprintf(", assigned_to = $%d", argCount)
		args = append(args, *params.AssignedTo)
		argCount++
	}

	if params.CompletedAt != nil {
		query += fmt.Sprintf(", completed_at = $%d", argCount)
		args = append(args, *params.CompletedAt)
		argCount++
	}

	// Завершаем запрос
	query += fmt.Sprintf(" WHERE id = $%d", argCount)
	args = append(args, id)

	// Выполняем запрос
	_, err := r.db.Exec(query, args...)
	return err
}

// DeleteHelpRequest удаляет запрос о помощи
func (r *Repository) DeleteHelpRequest(id int) error {
	query := "DELETE FROM help_requests WHERE id = $1"
	_, err := r.db.Exec(query, id)
	return err
}

// CompleteHelpRequest отмечает запрос как завершенный и обновляет статистику
func (r *Repository) CompleteHelpRequest(requestID, volunteerID int) error {
	// Получаем запрос для проверки
	request, err := r.GetHelpRequestByID(requestID)
	if err != nil {
		return err
	}
	if request == nil {
		return fmt.Errorf("request with ID %d not found", requestID)
	}

	// Проверяем, что запрос назначен указанному волонтеру
	if request.AssignedTo == nil || *request.AssignedTo != volunteerID {
		return fmt.Errorf("request is not assigned to volunteer with ID %d", volunteerID)
	}

	// Обновляем время завершения, если оно еще не установлено
	if request.CompletedAt == nil {
		now := time.Now()
		completedAtParam := &RequestUpdateParams{
			CompletedAt: &now,
			Status:      strPtr("completed"),
		}
		if err := r.UpdateHelpRequest(requestID, completedAtParam); err != nil {
			return err
		}
	}

	// Обновляем статистику волонтера
	volunteerStats, err := r.GetUserStats(volunteerID)
	if err != nil {
		return err
	}

	volunteerStats.CompletedRequests++
	volunteerStats.Experience += 50 // Бонус опыта за выполнение запроса

	if err := r.UpdateUserStats(volunteerStats); err != nil {
		return err
	}

	// Добавляем опыт создателю запроса
	if err := r.AddExperience(request.RequesterID, 20); err != nil {
		// Не критическая ошибка, логируем и продолжаем
		fmt.Printf("Error adding experience to requester: %v\n", err)
	}

	return nil
}

// strPtr возвращает указатель на строку
func strPtr(s string) *string {
	return &s
}

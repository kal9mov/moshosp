package requestrepo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository"

	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
)

// Ошибки репозитория запросов
var (
	ErrRequestNotFound  = errors.New("request not found")
	ErrUserNotFound     = errors.New("user not found")
	ErrCategoryNotFound = errors.New("category not found")
)

// RequestRepository представляет репозиторий для работы с запросами на помощь
type RequestRepository struct {
	db     *sqlx.DB
	logger *logrus.Logger
}

// NewRequestRepository создает новый экземпляр репозитория запросов
func NewRequestRepository(db *sqlx.DB, logger *logrus.Logger) *RequestRepository {
	return &RequestRepository{
		db:     db,
		logger: logger,
	}
}

// CreateRequest создает новый запрос о помощи
func (r *RequestRepository) CreateRequest(ctx context.Context, req *models.HelpRequest) (*models.HelpRequest, error) {
	query := `
		INSERT INTO help_requests (
			title, description, status, category_id, priority, location_address, location_lat, location_lon, 
			requester_id, is_deleted
		) VALUES (
			:title, :description, :status, :category_id, :priority, :location_address, :location_lat, :location_lon, 
			:requester_id, :is_deleted
		) RETURNING id, title, description, status, category_id, priority, location_address, location_lat, location_lon,
			requester_id, assigned_user_id, is_deleted, created_at, updated_at, completed_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, req)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("no rows returned after request creation")
	}

	var createdRequest models.HelpRequest
	if err := rows.StructScan(&createdRequest); err != nil {
		return nil, fmt.Errorf("failed to scan created request: %w", err)
	}

	return &createdRequest, nil
}

// GetRequestByID получает запрос по ID
func (r *RequestRepository) GetRequestByID(ctx context.Context, id int) (*models.HelpRequest, error) {
	var request models.HelpRequest
	query := `
		SELECT id, title, description, status, category_id, priority, location_address, location_lat, location_lon,
			requester_id, assigned_user_id, is_deleted, created_at, updated_at, completed_at
		FROM help_requests
		WHERE id = $1 AND is_deleted = false
	`

	err := r.db.GetContext(ctx, &request, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get request by ID: %w", err)
	}

	return &request, nil
}

// GetRequestFullInfo получает полную информацию о запросе
func (r *RequestRepository) GetRequestFullInfo(ctx context.Context, id int) (*models.RequestFullInfo, error) {
	query := `
		SELECT 
			r.id, r.title, r.description, r.status, r.category_id, c.name as category_name, 
			c.description as category_description, c.icon as category_icon, c.color as category_color,
			r.priority, r.location_address, r.location_lat, r.location_lon,
			r.requester_id, u1.username as requester_username, u1.first_name as requester_first_name, 
			u1.last_name as requester_last_name, u1.photo_url as requester_photo_url,
			r.assigned_user_id, u2.username as volunteer_username, u2.first_name as volunteer_first_name, 
			u2.last_name as volunteer_last_name, u2.photo_url as volunteer_photo_url,
			r.is_deleted, r.created_at, r.updated_at, r.completed_at
		FROM help_requests r
		LEFT JOIN users u1 ON r.requester_id = u1.id
		LEFT JOIN users u2 ON r.assigned_user_id = u2.id
		LEFT JOIN request_categories c ON r.category_id = c.id
		WHERE r.id = $1 AND r.is_deleted = false
	`

	var requestInfo models.RequestFullInfo
	err := r.db.GetContext(ctx, &requestInfo, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, repository.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get request full info: %w", err)
	}

	// Получаем комментарии к запросу
	commentsQuery := `
		SELECT 
			c.id, c.request_id, c.user_id, u.username, u.first_name, u.last_name, u.photo_url,
			c.content, c.created_at
		FROM request_comments c
		INNER JOIN users u ON c.user_id = u.id
		WHERE c.request_id = $1
		ORDER BY c.created_at
	`

	err = r.db.SelectContext(ctx, &requestInfo.Comments, commentsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get request comments: %w", err)
	}

	// Получаем оценки запроса
	ratingsQuery := `
		SELECT 
			r.id, r.request_id, r.rater_id, u1.username as rater_username, u1.first_name as rater_first_name, 
			u1.last_name as rater_last_name, u1.photo_url as rater_photo_url,
			r.rated_user_id, u2.username as rated_username, u2.first_name as rated_first_name, 
			u2.last_name as rated_last_name, u2.photo_url as rated_photo_url,
			r.rating, r.comment, r.created_at
		FROM request_ratings r
		INNER JOIN users u1 ON r.rater_id = u1.id
		INNER JOIN users u2 ON r.rated_user_id = u2.id
		WHERE r.request_id = $1
	`

	err = r.db.SelectContext(ctx, &requestInfo.Ratings, ratingsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get request ratings: %w", err)
	}

	return &requestInfo, nil
}

// GetRequests получает список запросов с фильтрацией
func (r *RequestRepository) GetRequests(ctx context.Context, userID *int, status string, categoryID *int, limit, offset int) ([]models.RequestFullInfo, error) {
	whereClause := "WHERE r.is_deleted = false"
	var params []interface{}
	paramCount := 1

	if userID != nil {
		whereClause += fmt.Sprintf(" AND (r.requester_id = $%d OR r.assigned_user_id = $%d)", paramCount, paramCount)
		params = append(params, *userID)
		paramCount++
	}

	if status != "" {
		whereClause += fmt.Sprintf(" AND r.status = $%d", paramCount)
		params = append(params, status)
		paramCount++
	}

	if categoryID != nil {
		whereClause += fmt.Sprintf(" AND r.category_id = $%d", paramCount)
		params = append(params, *categoryID)
		paramCount++
	}

	query := fmt.Sprintf(`
		SELECT 
			r.id, r.title, r.description, r.status, r.category_id, c.name as category_name, 
			c.description as category_description, c.icon as category_icon, c.color as category_color,
			r.priority, r.location_address, r.location_lat, r.location_lon,
			r.requester_id, u1.username as requester_username, u1.first_name as requester_first_name, 
			u1.last_name as requester_last_name, u1.photo_url as requester_photo_url,
			r.assigned_user_id, u2.username as volunteer_username, u2.first_name as volunteer_first_name, 
			u2.last_name as volunteer_last_name, u2.photo_url as volunteer_photo_url,
			r.is_deleted, r.created_at, r.updated_at, r.completed_at
		FROM help_requests r
		LEFT JOIN users u1 ON r.requester_id = u1.id
		LEFT JOIN users u2 ON r.assigned_user_id = u2.id
		LEFT JOIN request_categories c ON r.category_id = c.id
		%s
		ORDER BY 
			CASE WHEN r.status = 'new' THEN 1
				 WHEN r.status = 'in_progress' THEN 2
				 WHEN r.status = 'completed' THEN 3
				 ELSE 4
			END,
			CASE WHEN r.priority = 'high' THEN 1
				 WHEN r.priority = 'medium' THEN 2
				 ELSE 3
			END,
			r.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, paramCount, paramCount+1)

	params = append(params, limit, offset)

	var requests []models.RequestFullInfo
	err := r.db.SelectContext(ctx, &requests, query, params...)
	if err != nil {
		return nil, fmt.Errorf("failed to get requests: %w", err)
	}

	return requests, nil
}

// UpdateRequest обновляет запрос
func (r *RequestRepository) UpdateRequest(ctx context.Context, id int, update *models.RequestUpdateInput) (*models.HelpRequest, error) {
	request, err := r.GetRequestByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Обновляем поля, если они присутствуют
	if update.Title != nil {
		request.Title = *update.Title
	}
	if update.Description != nil {
		request.Description = *update.Description
	}
	if update.Status != nil {
		request.Status = *update.Status
		// Если статус изменился на "completed", обновляем время завершения
		if *update.Status == string(models.RequestStatusCompleted) {
			now := time.Now()
			request.CompletedAt = &now
		}
	}
	if update.CategoryID != nil {
		request.CategoryID = *update.CategoryID
	}
	if update.Priority != nil {
		request.Priority = *update.Priority
	}
	if update.LocationAddress != nil {
		request.LocationAddress = *update.LocationAddress
	}
	if update.LocationLat != nil {
		request.LocationLat = update.LocationLat
	}
	if update.LocationLon != nil {
		request.LocationLon = update.LocationLon
	}
	if update.AssignedUserID != nil {
		request.AssignedUserID = update.AssignedUserID
	}

	// Обновляем время изменения
	request.UpdatedAt = time.Now()

	query := `
		UPDATE help_requests
		SET title = :title,
			description = :description,
			status = :status,
			category_id = :category_id,
			priority = :priority,
			location_address = :location_address,
			location_lat = :location_lat,
			location_lon = :location_lon,
			assigned_user_id = :assigned_user_id,
			updated_at = :updated_at,
			completed_at = :completed_at
		WHERE id = :id AND is_deleted = false
		RETURNING id, title, description, status, category_id, priority, location_address, location_lat, location_lon,
			requester_id, assigned_user_id, is_deleted, created_at, updated_at, completed_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, request)
	if err != nil {
		return nil, fmt.Errorf("failed to update request: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, repository.ErrNotFound
	}

	var updatedRequest models.HelpRequest
	if err := rows.StructScan(&updatedRequest); err != nil {
		return nil, fmt.Errorf("failed to scan updated request: %w", err)
	}

	return &updatedRequest, nil
}

// DeleteRequest помечает запрос как удаленный
func (r *RequestRepository) DeleteRequest(ctx context.Context, id int) error {
	query := `
		UPDATE help_requests
		SET is_deleted = true
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete request: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return repository.ErrNotFound
	}

	return nil
}

// AddComment добавляет комментарий к запросу
func (r *RequestRepository) AddComment(ctx context.Context, comment *models.RequestComment) (*models.RequestComment, error) {
	query := `
		INSERT INTO request_comments (request_id, user_id, content)
		VALUES (:request_id, :user_id, :content)
		RETURNING id, request_id, user_id, content, created_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to add comment: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("no rows returned after comment creation")
	}

	var createdComment models.RequestComment
	if err := rows.StructScan(&createdComment); err != nil {
		return nil, fmt.Errorf("failed to scan created comment: %w", err)
	}

	// Получаем информацию о пользователе
	userQuery := `
		SELECT username, first_name, last_name, photo_url
		FROM users
		WHERE id = $1
	`

	var user models.UserShort
	err = r.db.GetContext(ctx, &user, userQuery, comment.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	createdComment.User = &user

	return &createdComment, nil
}

// AddRating добавляет оценку к запросу
func (r *RequestRepository) AddRating(ctx context.Context, rating *models.RequestRating) (*models.RequestRating, error) {
	// Проверяем наличие запроса
	_, err := r.GetRequestByID(ctx, rating.RequestID)
	if err != nil {
		return nil, err
	}

	// Проверяем, не ставил ли пользователь уже оценку
	existingQuery := `
		SELECT id FROM request_ratings
		WHERE request_id = $1 AND rater_id = $2 AND rated_user_id = $3
	`

	var existingID int
	err = r.db.GetContext(ctx, &existingID, existingQuery, rating.RequestID, rating.RaterID, rating.RatedUserID)
	if err == nil {
		return nil, repository.ErrConflict
	} else if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check existing rating: %w", err)
	}

	// Добавляем оценку
	query := `
		INSERT INTO request_ratings (request_id, rater_id, rated_user_id, rating, comment)
		VALUES (:request_id, :rater_id, :rated_user_id, :rating, :comment)
		RETURNING id, request_id, rater_id, rated_user_id, rating, comment, created_at
	`

	rows, err := r.db.NamedQueryContext(ctx, query, rating)
	if err != nil {
		return nil, fmt.Errorf("failed to add rating: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("no rows returned after rating creation")
	}

	var createdRating models.RequestRating
	if err := rows.StructScan(&createdRating); err != nil {
		return nil, fmt.Errorf("failed to scan created rating: %w", err)
	}

	// Получаем информацию о пользователях
	raterQuery := `
		SELECT username, first_name, last_name, photo_url
		FROM users
		WHERE id = $1
	`

	var rater models.UserShort
	err = r.db.GetContext(ctx, &rater, raterQuery, rating.RaterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rater info: %w", err)
	}

	var rated models.UserShort
	err = r.db.GetContext(ctx, &rated, raterQuery, rating.RatedUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rated user info: %w", err)
	}

	createdRating.Rater = &rater
	createdRating.RatedUser = &rated

	return &createdRating, nil
}

// GetCategories получает список категорий запросов
func (r *RequestRepository) GetCategories(ctx context.Context) ([]models.RequestCategory, error) {
	query := `
		SELECT id, name, description, icon, color, created_at, updated_at
		FROM request_categories
		ORDER BY name
	`

	var categories []models.RequestCategory
	err := r.db.SelectContext(ctx, &categories, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}

	return categories, nil
}

// GetStats получает статистику запросов
func (r *RequestRepository) GetStats(ctx context.Context) (*models.RequestStats, error) {
	query := `
		SELECT 
			(SELECT COUNT(*) FROM help_requests WHERE is_deleted = false) as total_requests,
			(SELECT COUNT(*) FROM help_requests WHERE status = 'completed' AND is_deleted = false) as completed_requests,
			(SELECT COUNT(*) FROM users WHERE role = 'volunteer') as total_volunteers,
			(SELECT AVG(rating) FROM request_ratings) as avg_rating
	`

	var stats models.RequestStats
	err := r.db.GetContext(ctx, &stats, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	return &stats, nil
}

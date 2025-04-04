package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository"
	"moshosp/backend/internal/repository/requestrepo"
)

// RequestService определяет интерфейс для работы с запросами на помощь
type RequestService struct {
	repo        *repository.Repository
	logger      *logrus.Logger
	gameService *GameService
}

// NewRequestService создает новый экземпляр сервиса запросов
func NewRequestService(repo *repository.Repository, gameService *GameService, logger *logrus.Logger) *RequestService {
	return &RequestService{
		repo:        repo,
		logger:      logger,
		gameService: gameService,
	}
}

// GetRequests возвращает список запросов с фильтрацией и пагинацией
func (s *RequestService) GetRequests(status, category string, page, limit int) ([]models.RequestFullInfo, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return s.repo.Request.GetRequests(ctx, status, category, page, limit)
}

// GetRequestByID возвращает информацию о запросе по ID
func (s *RequestService) GetRequestByID(id int) (models.RequestFullInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	request, err := s.repo.Request.GetRequestByID(ctx, id)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.RequestFullInfo{}, models.ErrNotFound
		}
		return models.RequestFullInfo{}, err
	}

	return request, nil
}

// GetRequestComments возвращает комментарии для запроса
func (s *RequestService) GetRequestComments(requestID int) ([]models.RequestComment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	comments, err := s.repo.Request.GetRequestComments(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return nil, models.ErrNotFound
		}
		return nil, err
	}

	return comments, nil
}

// CreateRequest создает новый запрос на помощь
func (s *RequestService) CreateRequest(userID int, input models.RequestCreateInput) (models.RequestFullInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Проверка существования пользователя
	user, err := s.repo.User.GetUserByID(ctx, userID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get user: %w", err)
	}

	// Создание запроса
	request := models.HelpRequest{
		Title:       input.Title,
		Description: input.Description,
		Location:    input.Location,
		CategoryID:  input.CategoryID,
		Priority:    models.RequestPriority(input.Priority),
		Status:      models.RequestStatusNew,
		AuthorID:    userID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	createdRequest, err := s.repo.Request.CreateRequest(ctx, request)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to create request: %w", err)
	}

	// Добавление опыта за создание запроса
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.gameService.AddExperience(ctx, userID, 10, "create_request"); err != nil {
			s.logger.WithError(err).Error("Failed to add experience for request creation")
		}
	}()

	// Получаем полную информацию о запросе
	fullInfo, err := s.repo.Request.GetRequestByID(ctx, createdRequest.ID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get created request: %w", err)
	}

	return fullInfo, nil
}

// UpdateRequest обновляет существующий запрос
func (s *RequestService) UpdateRequest(userID, requestID int, input models.RequestUpdateInput) (models.RequestFullInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Получение текущего запроса
	existingRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.RequestFullInfo{}, models.ErrNotFound
		}
		return models.RequestFullInfo{}, err
	}

	// Проверка прав на редактирование
	if existingRequest.Author.ID != userID {
		// Проверка на администратора может быть добавлена здесь
		return models.RequestFullInfo{}, models.ErrForbidden
	}

	// Обновление полей запроса
	updateData := models.HelpRequest{
		ID: requestID,
	}

	if input.Title != nil {
		updateData.Title = *input.Title
	}
	if input.Description != nil {
		updateData.Description = *input.Description
	}
	if input.Location != nil {
		updateData.Location = *input.Location
	}
	if input.CategoryID != nil {
		updateData.CategoryID = *input.CategoryID
	}
	if input.Priority != nil {
		updateData.Priority = models.RequestPriority(*input.Priority)
	}
	updateData.UpdatedAt = time.Now()

	err = s.repo.Request.UpdateRequest(ctx, updateData)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to update request: %w", err)
	}

	// Получаем обновленную информацию о запросе
	updatedRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get updated request: %w", err)
	}

	return updatedRequest, nil
}

// DeleteRequest удаляет запрос
func (s *RequestService) DeleteRequest(userID, requestID int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Получение текущего запроса
	existingRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.ErrNotFound
		}
		return err
	}

	// Проверка прав на удаление
	if existingRequest.Author.ID != userID {
		// Проверка на администратора может быть добавлена здесь
		return models.ErrForbidden
	}

	// Удаление запроса
	err = s.repo.Request.DeleteRequest(ctx, requestID)
	if err != nil {
		return fmt.Errorf("failed to delete request: %w", err)
	}

	return nil
}

// AddComment добавляет комментарий к запросу
func (s *RequestService) AddComment(userID, requestID int, input models.RequestCommentInput) (models.RequestComment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Проверка существования запроса
	_, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.RequestComment{}, models.ErrNotFound
		}
		return models.RequestComment{}, err
	}

	// Проверка существования пользователя
	user, err := s.repo.User.GetUserByID(ctx, userID)
	if err != nil {
		return models.RequestComment{}, fmt.Errorf("failed to get user: %w", err)
	}

	// Создание комментария
	comment := models.RequestComment{
		RequestID: requestID,
		UserID:    userID,
		Text:      input.Text,
		CreatedAt: time.Now(),
	}

	createdComment, err := s.repo.Request.AddComment(ctx, comment)
	if err != nil {
		return models.RequestComment{}, fmt.Errorf("failed to add comment: %w", err)
	}

	// Добавляем информацию о пользователе в комментарий
	createdComment.User = models.UserShort{
		ID:        user.ID,
		Name:      user.Name,
		AvatarURL: user.AvatarURL,
	}

	// Добавление опыта за комментарий
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.gameService.AddExperience(ctx, userID, 5, "add_comment"); err != nil {
			s.logger.WithError(err).Error("Failed to add experience for comment")
		}
	}()

	return createdComment, nil
}

// TakeRequest позволяет волонтеру взять запрос на выполнение
func (s *RequestService) TakeRequest(userID, requestID int) (models.RequestFullInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Получение текущего запроса
	existingRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.RequestFullInfo{}, models.ErrNotFound
		}
		return models.RequestFullInfo{}, err
	}

	// Проверка статуса запроса
	if existingRequest.Status != models.RequestStatusNew {
		return models.RequestFullInfo{}, models.ErrConflict
	}

	// Проверка, что пользователь является волонтером
	user, err := s.repo.User.GetUserByID(ctx, userID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get user: %w", err)
	}

	if user.Role != models.UserRoleVolunteer && user.Role != models.UserRoleAdmin {
		return models.RequestFullInfo{}, models.ErrForbidden
	}

	// Обновление запроса
	err = s.repo.Request.UpdateRequestStatus(ctx, requestID, models.RequestStatusInProgress, userID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to update request status: %w", err)
	}

	// Добавление опыта за взятие запроса
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.gameService.AddExperience(ctx, userID, 15, "take_request"); err != nil {
			s.logger.WithError(err).Error("Failed to add experience for taking request")
		}
	}()

	// Получаем обновленную информацию о запросе
	updatedRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get updated request: %w", err)
	}

	return updatedRequest, nil
}

// CompleteRequest отмечает запрос как выполненный
func (s *RequestService) CompleteRequest(userID, requestID int) (models.RequestFullInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Получение текущего запроса
	existingRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.RequestFullInfo{}, models.ErrNotFound
		}
		return models.RequestFullInfo{}, err
	}

	// Проверка, что пользователь является исполнителем запроса или автором
	if existingRequest.Volunteer.ID != userID && existingRequest.Author.ID != userID {
		// Проверка на администратора может быть добавлена здесь
		return models.RequestFullInfo{}, models.ErrForbidden
	}

	// Проверка статуса запроса
	if existingRequest.Status != models.RequestStatusInProgress {
		return models.RequestFullInfo{}, fmt.Errorf("request must be in progress to complete it")
	}

	// Обновление запроса
	err = s.repo.Request.UpdateRequestStatus(ctx, requestID, models.RequestStatusCompleted, 0)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to update request status: %w", err)
	}

	// Добавление опыта за выполнение запроса
	if existingRequest.Volunteer.ID > 0 {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			// Опыт в зависимости от приоритета запроса
			expAmount := 30
			switch existingRequest.Priority {
			case models.RequestPriorityHigh:
				expAmount = 50
			case models.RequestPriorityMedium:
				expAmount = 30
			case models.RequestPriorityLow:
				expAmount = 20
			}

			if err := s.gameService.AddExperience(ctx, existingRequest.Volunteer.ID, expAmount, "complete_request"); err != nil {
				s.logger.WithError(err).Error("Failed to add experience for completing request")
			}
		}()
	}

	// Получаем обновленную информацию о запросе
	updatedRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get updated request: %w", err)
	}

	return updatedRequest, nil
}

// CancelRequest отменяет запрос
func (s *RequestService) CancelRequest(userID, requestID int) (models.RequestFullInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Получение текущего запроса
	existingRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.RequestFullInfo{}, models.ErrNotFound
		}
		return models.RequestFullInfo{}, err
	}

	// Проверка, что пользователь является автором запроса или исполнителем
	if existingRequest.Author.ID != userID && existingRequest.Volunteer.ID != userID {
		// Проверка на администратора может быть добавлена здесь
		return models.RequestFullInfo{}, models.ErrForbidden
	}

	// Проверка статуса запроса
	if existingRequest.Status == models.RequestStatusCompleted || existingRequest.Status == models.RequestStatusCancelled {
		return models.RequestFullInfo{}, fmt.Errorf("request already completed or cancelled")
	}

	// Обновление запроса
	err = s.repo.Request.UpdateRequestStatus(ctx, requestID, models.RequestStatusCancelled, 0)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to update request status: %w", err)
	}

	// Получаем обновленную информацию о запросе
	updatedRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		return models.RequestFullInfo{}, fmt.Errorf("failed to get updated request: %w", err)
	}

	return updatedRequest, nil
}

// RateRequest оценивает выполненный запрос
func (s *RequestService) RateRequest(userID, requestID int, input models.RequestRatingInput) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Получение текущего запроса
	existingRequest, err := s.repo.Request.GetRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, requestrepo.ErrRequestNotFound) {
			return models.ErrNotFound
		}
		return err
	}

	// Проверка, что пользователь является автором запроса
	if existingRequest.Author.ID != userID {
		return models.ErrForbidden
	}

	// Проверка статуса запроса
	if existingRequest.Status != models.RequestStatusCompleted {
		return fmt.Errorf("only completed requests can be rated")
	}

	// Проверка, что запрос еще не оценен
	hasRating, err := s.repo.Request.HasRating(ctx, requestID)
	if err != nil {
		return fmt.Errorf("failed to check rating: %w", err)
	}
	if hasRating {
		return models.ErrConflict
	}

	// Создание оценки
	rating := models.RequestRating{
		RequestID: requestID,
		UserID:    userID,
		Rating:    input.Rating,
		Feedback:  input.Feedback,
		CreatedAt: time.Now(),
	}

	// Добавление оценки
	err = s.repo.Request.AddRating(ctx, rating)
	if err != nil {
		return fmt.Errorf("failed to add rating: %w", err)
	}

	// Добавление опыта волонтеру за положительную оценку
	if existingRequest.Volunteer.ID > 0 && input.Rating >= 4 {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			// Опыт в зависимости от оценки
			expAmount := 0
			switch input.Rating {
			case 5:
				expAmount = 25
			case 4:
				expAmount = 15
			}

			if expAmount > 0 {
				if err := s.gameService.AddExperience(ctx, existingRequest.Volunteer.ID, expAmount, "positive_rating"); err != nil {
					s.logger.WithError(err).Error("Failed to add experience for positive rating")
				}
			}
		}()
	}

	return nil
}

// GetRequestStats возвращает статистику по запросам
func (s *RequestService) GetRequestStats() (models.RequestStats, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return s.repo.Request.GetRequestStats(ctx)
}

// GetRequestCategories возвращает список категорий запросов
func (s *RequestService) GetRequestCategories() ([]models.RequestCategory, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return s.repo.Request.GetRequestCategories(ctx)
}

// GetUserRequests возвращает список запросов, созданных пользователем
func (s *RequestService) GetUserRequests(userID int, status string, page, limit int) ([]models.RequestFullInfo, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	offset := (page - 1) * limit
	return s.repo.Request.GetUserRequests(ctx, userID, status, limit, offset)
}

// GetVolunteerRequests возвращает список запросов, взятых пользователем как волонтер
func (s *RequestService) GetVolunteerRequests(userID int, status string, page, limit int) ([]models.RequestFullInfo, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	offset := (page - 1) * limit
	return s.repo.Request.GetVolunteerRequests(ctx, userID, status, limit, offset)
}

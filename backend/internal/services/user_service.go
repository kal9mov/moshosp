package services

import (
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/dgrijalva/jwt-go"

	"moshosp/backend/internal/config"
	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/repository/gamerepo"
	"moshosp/backend/internal/repository/userrepo"
)

// UserService представляет сервис для работы с пользователями
type UserService struct {
	userRepo    *userrepo.UserRepository
	gameRepo    *gamerepo.GameRepository
	jwtSecret   string
	jwtExpiry   time.Duration
	telegramKey string
}

// NewUserService создает новый экземпляр UserService
func NewUserService(
	userRepo *userrepo.UserRepository,
	gameRepo *gamerepo.GameRepository,
	jwtConfig config.JWTConfig,
) *UserService {
	return &UserService{
		userRepo:  userRepo,
		gameRepo:  gameRepo,
		jwtSecret: jwtConfig.Secret,
		jwtExpiry: time.Duration(jwtConfig.ExpiryHours) * time.Hour,
	}
}

// Login аутентифицирует пользователя по телеграм ID
func (s *UserService) Login(input models.UserAuthInput) (*models.AuthResponse, error) {
	// Получаем пользователя по телеграм ID
	user, err := s.userRepo.GetUserByTelegramID(input.TelegramID)
	if err != nil {
		if errors.Is(err, userrepo.ErrNotFound) {
			// Если пользователь не найден, создаем нового
			user = &models.User{
				TelegramID:    input.TelegramID,
				Username:      input.Username,
				FirstName:     input.FirstName,
				LastName:      input.LastName,
				Role:          models.UserRoleUser,
				PhoneNumber:   input.PhoneNumber,
				ProfileAvatar: input.PhotoURL,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			}

			userID, err := s.userRepo.CreateUser(user)
			if err != nil {
				slog.Error("Ошибка создания пользователя", "error", err)
				return nil, fmt.Errorf("не удалось создать пользователя: %w", err)
			}
			user.ID = userID

			// Создаем игровые данные для нового пользователя
			if err := s.gameRepo.CreateInitialGameData(userID); err != nil {
				slog.Error("Ошибка создания игровых данных", "error", err)
				// Не возвращаем ошибку, так как это не критично для авторизации
			}
		} else {
			slog.Error("Ошибка получения пользователя", "error", err)
			return nil, fmt.Errorf("не удалось получить пользователя: %w", err)
		}
	}

	// Генерируем токен
	token, err := s.generateToken(user.ID)
	if err != nil {
		slog.Error("Ошибка генерации токена", "error", err)
		return nil, fmt.Errorf("не удалось сгенерировать токен: %w", err)
	}

	// Обновляем дату последнего входа пользователя
	user.LastLoginAt = time.Now()
	if err := s.userRepo.UpdateUser(user); err != nil {
		slog.Error("Ошибка обновления даты входа", "error", err)
		// Не возвращаем ошибку, так как это не критично для авторизации
	}

	return &models.AuthResponse{
		Token:     token,
		ExpiresIn: int(s.jwtExpiry.Seconds()),
		User:      *user,
	}, nil
}

// LoginWithTelegram аутентифицирует пользователя через Telegram
func (s *UserService) LoginWithTelegram(input models.UserAuthInput) (*models.AuthResponse, error) {
	// Здесь должна быть логика проверки данных от Telegram Login Widget
	// Это может включать проверку подписи данных с помощью ключа бота
	// Для упрощения мы просто используем обычную логику входа

	return s.Login(input)
}

// RefreshToken обновляет JWT токен пользователя
func (s *UserService) RefreshToken(refreshToken string) (*models.AuthResponse, error) {
	// Проверяем токен и получаем ID пользователя
	userID, err := s.ValidateToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("недействительный токен: %w", err)
	}

	// Получаем информацию о пользователе
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("пользователь не найден: %w", err)
	}

	// Генерируем новый токен
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("не удалось сгенерировать токен: %w", err)
	}

	return &models.AuthResponse{
		Token:     token,
		ExpiresIn: int(s.jwtExpiry.Seconds()),
		User:      *user,
	}, nil
}

// RegisterUserDevice регистрирует устройство пользователя для получения уведомлений
func (s *UserService) RegisterUserDevice(userID int, deviceToken string) error {
	// В реальном приложении здесь будет логика для сохранения токена устройства
	// для последующей отправки push-уведомлений
	return nil
}

// UpdateUserProfile обновляет профиль пользователя
func (s *UserService) UpdateUserProfile(userID int, input models.UserProfileUpdate) error {
	return s.userRepo.UpdateUserProfile(userID, input)
}

// GetUserByID возвращает пользователя по ID
func (s *UserService) GetUserByID(userID int) (*models.User, error) {
	return s.userRepo.GetUserByID(userID)
}

// GetUserFullInfo возвращает полную информацию о пользователе
func (s *UserService) GetUserFullInfo(userID int) (*models.UserFullInfo, error) {
	return s.userRepo.GetUserFullInfo(userID)
}

// GetLeaderboard возвращает список лидеров
func (s *UserService) GetLeaderboard(limit, offset int) ([]models.LeaderboardUser, error) {
	return s.userRepo.GetLeaderboard(limit, offset)
}

// ValidateToken проверяет JWT токен и возвращает ID пользователя
func (s *UserService) ValidateToken(tokenString string) (int, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Проверяем, что используется правильный алгоритм подписи
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Проверяем время жизни токена
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				return 0, errors.New("токен истек")
			}
		} else {
			return 0, errors.New("некорректный токен: отсутствует время истечения")
		}

		// Извлекаем ID пользователя
		if userID, ok := claims["user_id"].(float64); ok {
			return int(userID), nil
		}
		return 0, errors.New("некорректный токен: отсутствует ID пользователя")
	}

	return 0, errors.New("недействительный токен")
}

// generateToken генерирует новый JWT токен
func (s *UserService) generateToken(userID int) (string, error) {
	// Создаем новые claims
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(s.jwtExpiry).Unix(),
	}

	// Создаем токен с claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Подписываем токен секретным ключом
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

package middleware

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"moshosp/backend/internal/domain/models"
	"moshosp/backend/internal/services"

	"github.com/dgrijalva/jwt-go"
)

// AuthMiddleware проверяет JWT токен и добавляет идентификатор пользователя в контекст
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Извлекаем токен из заголовка Authorization
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header is required", http.StatusUnauthorized)
				return
			}

			// Проверяем формат Bearer token
			headerParts := strings.Split(authHeader, " ")
			if len(headerParts) != 2 || headerParts[0] != "Bearer" {
				http.Error(w, "Invalid authorization format. Format is 'Bearer {token}'", http.StatusUnauthorized)
				return
			}

			tokenString := headerParts[1]

			// Валидация токена
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				// Проверяем алгоритм подписи
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err != nil {
				http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
				return
			}

			// Проверяем валидность токена
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok || !token.Valid {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			// Проверяем тип токена (должен быть "access")
			tokenType, ok := claims["token_type"].(string)
			if !ok || tokenType != "access" {
				http.Error(w, "Invalid token type", http.StatusUnauthorized)
				return
			}

			// Получаем ID пользователя из токена
			userIDFloat, ok := claims["user_id"].(float64)
			if !ok {
				http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
				return
			}
			userID := int(userIDFloat)

			// Получаем роль пользователя
			role, ok := claims["role"].(string)
			if !ok {
				http.Error(w, "Invalid user role in token", http.StatusUnauthorized)
				return
			}

			// Добавляем ID и роль пользователя в контекст
			ctx := context.WithValue(r.Context(), "user_id", userID)
			ctx = context.WithValue(ctx, "user_role", role)

			// Продолжаем обработку запроса с обновленным контекстом
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminOnly проверяет, что пользователь имеет роль администратора
func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := r.Context().Value("user_role").(string)
		if !ok || role != "admin" {
			http.Error(w, "Access denied: Admin privileges required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// VolunteerOnly проверяет, что пользователь имеет роль волонтера или администратора
func VolunteerOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := r.Context().Value("user_role").(string)
		if !ok || (role != "volunteer" && role != "admin") {
			http.Error(w, "Access denied: Volunteer privileges required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// GetUserIDFromContext извлекает ID пользователя из контекста
func GetUserIDFromContext(ctx context.Context) (int, error) {
	userID, ok := ctx.Value("user_id").(int)
	if !ok {
		return 0, errors.New("user ID not found in context")
	}
	return userID, nil
}

// AuthMiddleware представляет middleware для авторизации пользователей
type AuthMiddleware struct {
	userService *services.UserService
}

// NewAuthMiddleware создает новый экземпляр AuthMiddleware
func NewAuthMiddleware(userService *services.UserService) *AuthMiddleware {
	return &AuthMiddleware{
		userService: userService,
	}
}

// Authorize проверяет авторизацию пользователя
func (m *AuthMiddleware) Authorize(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Извлекаем токен из заголовка Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeErrorResponse(w, "Отсутствует заголовок Authorization", http.StatusUnauthorized)
			return
		}

		// Проверяем формат токена
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			writeErrorResponse(w, "Неверный формат токена авторизации", http.StatusUnauthorized)
			return
		}
		token := parts[1]

		// Проверяем токен и получаем ID пользователя
		userID, err := m.userService.ValidateToken(token)
		if err != nil {
			writeErrorResponse(w, "Недействительный токен авторизации", http.StatusUnauthorized)
			return
		}

		// Получаем информацию о пользователе
		user, err := m.userService.GetUserByID(userID)
		if err != nil {
			writeErrorResponse(w, "Пользователь не найден", http.StatusUnauthorized)
			return
		}

		// Устанавливаем пользователя в контекст запроса
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuth проверяет авторизацию, но не требует её
func (m *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Извлекаем токен из заголовка Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// Если токена нет, просто продолжаем без пользователя
			next.ServeHTTP(w, r)
			return
		}

		// Проверяем формат токена
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			// Если формат неверный, продолжаем без пользователя
			next.ServeHTTP(w, r)
			return
		}
		token := parts[1]

		// Проверяем токен и получаем ID пользователя
		userID, err := m.userService.ValidateToken(token)
		if err != nil {
			// Если токен недействителен, продолжаем без пользователя
			next.ServeHTTP(w, r)
			return
		}

		// Получаем информацию о пользователе
		user, err := m.userService.GetUserByID(userID)
		if err != nil {
			// Если пользователь не найден, продолжаем без пользователя
			next.ServeHTTP(w, r)
			return
		}

		// Устанавливаем пользователя в контекст запроса
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserContextKey ключ для получения пользователя из контекста
type contextKey string

// UserContextKey ключ для получения пользователя из контекста
const UserContextKey contextKey = "user"

// GetUserFromContext возвращает пользователя из контекста или nil, если пользователь не авторизован
func GetUserFromContext(ctx context.Context) *models.User {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	if !ok {
		return nil
	}
	return user
}

// writeErrorResponse записывает ответ с ошибкой в формате JSON
func writeErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write([]byte(`{"error": "` + message + `"}`))
}

package middleware

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Ключи контекста для хранения данных пользователя
const (
	UserIDKey   = "user_id"
	UserRoleKey = "user_role"
)

// JWTAuth - middleware для проверки JWT токенов
func JWTAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Получаем токен из заголовка Authorization
			tokenString := extractTokenFromHeader(r)
			if tokenString == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Проверяем и парсим токен
			claims, err := validateToken(tokenString, secret)
			if err != nil {
				http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
				return
			}

			// Получаем идентификатор пользователя из токена
			userID, err := claims.GetSubject()
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			// Получаем роль пользователя из токена (если есть)
			role, ok := claims["role"].(string)
			if !ok {
				role = "user" // По умолчанию - обычный пользователь
			}

			// Создаем новый контекст с данными пользователя
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserRoleKey, role)

			// Передаем управление следующему обработчику с обновленным контекстом
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extractTokenFromHeader извлекает JWT токен из заголовка Authorization
func extractTokenFromHeader(r *http.Request) string {
	// Получаем Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	// Проверяем формат "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

// validateToken проверяет валидность JWT токена
func validateToken(tokenString, secretKey string) (jwt.MapClaims, error) {
	// Парсим токен
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Проверяем алгоритм подписи
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	// Проверяем, валиден ли токен
	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Получаем claims из токена
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Проверяем срок действия токена
	exp, ok := claims["exp"].(float64)
	if !ok {
		return nil, errors.New("missing expiration time")
	}

	// Проверяем, не истек ли срок действия токена
	if time.Unix(int64(exp), 0).Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}

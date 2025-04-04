package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"moshosp/backend/internal/database"
	"moshosp/backend/internal/middleware"
)

// TelegramAuth представляет данные, полученные от Telegram Login Widget
type TelegramAuth struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
	PhotoURL  string `json:"photo_url,omitempty"`
	AuthDate  string `json:"auth_date"`
	Hash      string `json:"hash"`
}

// AuthHandler обрабатывает запросы, связанные с авторизацией
type AuthHandler struct {
	repo *database.Repository
}

// NewAuthHandler создает новый обработчик авторизации
func NewAuthHandler(repo *database.Repository) *AuthHandler {
	return &AuthHandler{
		repo: repo,
	}
}

// TelegramLogin обрабатывает авторизацию через Telegram Login Widget
func (h *AuthHandler) TelegramLogin(w http.ResponseWriter, r *http.Request) {
	var auth TelegramAuth
	if err := json.NewDecoder(r.Body).Decode(&auth); err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}

	// Проверка валидности данных от Telegram
	if !validateTelegramAuth(auth) {
		http.Error(w, "Неверные данные авторизации", http.StatusUnauthorized)
		return
	}

	// Проверка времени авторизации (не более 24 часов)
	authDate, err := strconv.ParseInt(auth.AuthDate, 10, 64)
	if err != nil {
		http.Error(w, "Неверный формат даты авторизации", http.StatusBadRequest)
		return
	}

	if time.Now().Unix()-authDate > 86400 {
		http.Error(w, "Срок действия авторизации истек", http.StatusUnauthorized)
		return
	}

	// Поиск или создание пользователя
	user, err := h.repo.GetUserByTelegramID(auth.ID)
	if err != nil {
		http.Error(w, "Ошибка при поиске пользователя: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if user == nil {
		// Пользователь не найден, создаем нового
		newUser := &database.User{
			TelegramID: auth.ID,
			Username:   auth.Username,
			FirstName:  auth.FirstName,
			LastName:   auth.LastName,
			PhotoURL:   auth.PhotoURL,
			Role:       "user", // По умолчанию обычный пользователь
		}

		if err := h.repo.CreateUser(newUser); err != nil {
			http.Error(w, "Ошибка создания пользователя: "+err.Error(), http.StatusInternalServerError)
			return
		}

		user = newUser
	} else {
		// Обновляем информацию пользователя
		username := auth.Username
		firstName := auth.FirstName
		lastName := auth.LastName
		photoURL := auth.PhotoURL

		params := &database.UserUpdateParams{
			Username:  &username,
			FirstName: &firstName,
			LastName:  &lastName,
			PhotoURL:  &photoURL,
		}

		if err := h.repo.UpdateUser(user.ID, params); err != nil {
			http.Error(w, "Ошибка обновления пользователя: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Создаем JWT токен
	token, err := middleware.CreateToken(int64(user.ID))
	if err != nil {
		http.Error(w, "Ошибка создания токена: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Возвращаем токен и информацию о пользователе
	response := map[string]interface{}{
		"token": token,
		"user":  user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetCurrentUser возвращает информацию о текущем пользователе
func (h *AuthHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из контекста (установлен middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Ошибка авторизации", http.StatusUnauthorized)
		return
	}

	// Получаем пользователя из БД
	user, err := h.repo.GetUserByID(int(userID))
	if err != nil {
		http.Error(w, "Ошибка при получении пользователя: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "Пользователь не найден", http.StatusNotFound)
		return
	}

	// Возвращаем информацию о пользователе
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// validateTelegramAuth проверяет подпись данных от Telegram
func validateTelegramAuth(auth TelegramAuth) bool {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		// Для разработки можно вернуть true
		// В продакшен-среде должна быть строгая проверка
		return true
	}

	// Получаем секретный ключ из токена бота
	secretKey := sha256.Sum256([]byte(botToken))

	// Собираем данные для проверки
	checkString := fmt.Sprintf(
		"auth_date=%s\nfirst_name=%s\nid=%s",
		auth.AuthDate, auth.FirstName, auth.ID,
	)

	if auth.LastName != "" {
		checkString += fmt.Sprintf("\nlast_name=%s", auth.LastName)
	}

	if auth.PhotoURL != "" {
		checkString += fmt.Sprintf("\nphoto_url=%s", auth.PhotoURL)
	}

	if auth.Username != "" {
		checkString += fmt.Sprintf("\nusername=%s", auth.Username)
	}

	// Вычисляем HMAC-SHA-256
	h := hmac.New(sha256.New, secretKey[:])
	h.Write([]byte(checkString))
	signature := hex.EncodeToString(h.Sum(nil))

	// Сравниваем с хешем от Telegram
	return signature == auth.Hash
}

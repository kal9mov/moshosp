package handlers

import (
	"net/http"

	authMiddleware "github.com/kal9mov/moshosp/backend/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// SetupRouter настраивает все маршруты приложения
func SetupRouter(
	userHandler *UserHandler,
	gameHandler *GameHandler,
	requestHandler *RequestHandler,
) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// Настройка CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Базовый маршрут для проверки работоспособности
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("MosHosp API"))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Публичные маршруты
	r.Group(func(r chi.Router) {
		// Аутентификация
		r.Route("/api/auth", func(r chi.Router) {
			r.Post("/login", userHandler.Login)
			r.Post("/telegram", userHandler.TelegramAuth)
			r.Post("/refresh", userHandler.RefreshToken)
		})

		// Публичная статистика
		r.Get("/api/stats", requestHandler.GetRequestStats)
		r.Get("/api/requests/categories", requestHandler.GetRequestCategories)
	})

	// Защищенные маршруты (требуют авторизации)
	r.Group(func(r chi.Router) {
		// Проверка JWT-токена
		r.Use(authMiddleware.JWTAuth)

		// Профиль пользователя
		r.Route("/api/users", func(r chi.Router) {
			r.Get("/me", userHandler.GetCurrentUser)
			r.Put("/me", userHandler.UpdateUserProfile)
			r.Get("/me/game", gameHandler.GetUserGameData)
			r.Get("/me/achievements", gameHandler.GetUserAchievements)
			r.Get("/leaderboard", gameHandler.GetLeaderboard)
		})

		// Заявки
		RegisterRequestRoutes(r, requestHandler)

		// Игровые функции
		RegisterGameRoutes(r, gameHandler)
	})

	return r
}

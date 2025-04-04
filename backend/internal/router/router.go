package router

import (
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"moshosp/backend/internal/handlers"
	appMiddleware "moshosp/backend/internal/middleware"
)

// Setup настраивает маршрутизатор API
func Setup(userHandler *handlers.UserHandler, requestHandler *handlers.RequestHandler, gameHandler *handlers.GameHandler) *chi.Mux {
	r := chi.NewRouter()

	// Базовые middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // В продакшене заменить на конкретные домены
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Максимальное время кеширования префлайт-запросов
	}))

	// Публичные маршруты
	r.Group(func(r chi.Router) {
		// Эндпоинты для аутентификации
		r.Post("/api/auth/login", userHandler.Login)
		r.Post("/api/auth/refresh", userHandler.RefreshToken)
		r.Post("/api/auth/telegram", userHandler.AuthWithTelegram)

		// Публичная статистика
		r.Get("/api/stats", requestHandler.GetRequestStats)
	})

	// Маршруты, требующие аутентификации
	r.Group(func(r chi.Router) {
		// JWT аутентификация
		r.Use(appMiddleware.JWTAuth(userHandler.JWTSecret))

		// Пользовательские маршруты
		r.Get("/api/users/me", userHandler.GetCurrentUser)
		r.Put("/api/users/me", userHandler.UpdateProfile)
		r.Post("/api/users/devices", userHandler.RegisterDevice)
		r.Get("/api/users/leaderboard", userHandler.GetLeaderboard)

		// Регистрация маршрутов для заявок
		handlers.RegisterRequestRoutes(r, requestHandler)

		// Регистрация маршрутов для игровой механики
		handlers.RegisterGameRoutes(r, gameHandler)
	})

	// Документация API (если используется)
	// r.Get("/swagger/*", httpSwagger.WrapHandler)

	return r
}

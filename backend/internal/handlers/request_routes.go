package handlers

import (
	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"

	"github.com/kal9mov/moshosp/backend/internal/middleware"
	"github.com/kal9mov/moshosp/backend/internal/repository"
	"github.com/kal9mov/moshosp/backend/internal/services"
)

// SetupRequestRoutes настраивает маршруты API для работы с запросами
func SetupRequestRoutes(router chi.Router, repo *repository.Repository, logger *logrus.Logger) {
	gameService := services.NewGameService(repo, logger)
	userService := services.NewUserService(repo, logger)
	requestService := services.NewRequestService(repo, gameService, logger)
	handler := NewRequestHandler(repo, requestService, gameService, userService, logger)

	router.Route("/api/requests", func(r chi.Router) {
		// Публичные маршруты
		r.Get("/", handler.GetRequests)
		r.Get("/{id}", handler.GetRequestByID)
		r.Get("/{id}/comments", handler.GetRequestComments)
		r.Get("/stats", handler.GetRequestStats)
		r.Get("/categories", handler.GetRequestCategories)

		// Защищенные маршруты (требуют авторизации)
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware)

			r.Post("/", handler.CreateRequest)
			r.Put("/{id}", handler.UpdateRequest)
			r.Delete("/{id}", handler.DeleteRequest)

			r.Post("/{id}/comments", handler.AddComment)
			r.Post("/{id}/take", handler.TakeRequest)
			r.Post("/{id}/complete", handler.CompleteRequest)
			r.Post("/{id}/cancel", handler.CancelRequest)
			r.Post("/{id}/rate", handler.RateRequest)
		})
	})

	// Маршруты для получения заявок пользователя
	router.With(middleware.AuthMiddleware).Get("/api/users/me/requests", handler.GetUserRequests)

	// Маршруты для получения заявок волонтера
	router.With(middleware.AuthMiddleware).Get("/api/users/me/volunteer-requests", handler.GetVolunteerRequests)
}

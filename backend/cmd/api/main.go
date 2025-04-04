package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"moshosp/backend/internal/config"
	"moshosp/backend/internal/db"
	"moshosp/backend/internal/handlers"
	"moshosp/backend/internal/repository"
	"moshosp/backend/internal/repository/gamerepo"
	"moshosp/backend/internal/repository/requestrepo"
	"moshosp/backend/internal/repository/userrepo"
	"moshosp/backend/internal/services"
)

func main() {
	// Инициализируем логгер
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Загружаем конфигурацию
	cfg, err := config.Load()
	if err != nil {
		logger.Error("Не удалось загрузить конфигурацию", "error", err)
		os.Exit(1)
	}

	// Подключаемся к базе данных
	database, err := db.Connect(cfg.Database)
	if err != nil {
		logger.Error("Не удалось подключиться к базе данных", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	// Создаем репозитории
	userRepo := userrepo.NewUserRepository(database, logger)
	gameRepo := gamerepo.NewGameRepository(database, logger)
	requestRepo := requestrepo.NewRequestRepository(database, logger)

	// Создаем общий репозиторий с интерфейсами
	repo := &repository.Repository{
		User:    userRepo,
		Game:    gameRepo,
		Request: requestRepo,
	}

	// Создаем сервисы
	userService := services.NewUserService(repo, cfg.JWT)
	gameService := services.NewGameService(repo, logger)
	requestService := services.NewRequestService(repo, gameService, logger)

	// Создаем обработчики
	userHandler := handlers.NewUserHandler(userService)
	gameHandler := handlers.NewGameHandler(gameService)
	requestHandler := handlers.NewRequestHandler(repo, requestService, gameService, userService, logger)

	// Настраиваем маршрутизатор
	router := handlers.SetupRouter(userHandler, gameHandler, requestHandler)

	// Создаем HTTP-сервер
	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Server.Port),
		Handler: router,
	}

	// Запускаем сервер в отдельной горутине
	go func() {
		logger.Info("Запуск сервера", "port", cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Ошибка запуска сервера", "error", err)
			os.Exit(1)
		}
	}()

	// Настраиваем обработку сигналов для корректного завершения
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Завершение работы сервера...")

	// Устанавливаем таймаут для завершения запросов
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("Ошибка при завершении сервера", "error", err)
		os.Exit(1)
	}

	logger.Info("Сервер успешно завершил работу")
}

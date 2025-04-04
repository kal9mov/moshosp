package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
)

// Config содержит все настройки приложения
type Config struct {
	// Настройки сервера
	ServerPort                int
	ServerReadTimeoutSeconds  int
	ServerWriteTimeoutSeconds int
	ServerIdleTimeoutSeconds  int

	// Настройки базы данных
	DB DatabaseConfig

	// Настройки JWT
	JWT JWTConfig

	// Настройки метрик
	MetricsEnabled bool
	MetricsPath    string

	// Режим работы приложения
	AppEnv string
}

// DatabaseConfig содержит настройки подключения к базе данных
type DatabaseConfig struct {
	Host                   string
	Port                   int
	User                   string
	Password               string
	Name                   string
	SSLMode                string
	MaxOpenConns           int
	MaxIdleConns           int
	ConnMaxLifetimeMinutes int
}

// JWTConfig содержит настройки для JWT токенов
type JWTConfig struct {
	Secret      string
	ExpiryHours int
}

// Load загружает конфигурацию из переменных окружения
func Load() (*Config, error) {
	var cfg Config
	var err error

	// Настройки сервера
	cfg.ServerPort, err = getEnvInt("SERVER_PORT", 8080)
	if err != nil {
		return nil, err
	}

	cfg.ServerReadTimeoutSeconds, err = getEnvInt("SERVER_READ_TIMEOUT_SECONDS", 30)
	if err != nil {
		return nil, err
	}

	cfg.ServerWriteTimeoutSeconds, err = getEnvInt("SERVER_WRITE_TIMEOUT_SECONDS", 30)
	if err != nil {
		return nil, err
	}

	cfg.ServerIdleTimeoutSeconds, err = getEnvInt("SERVER_IDLE_TIMEOUT_SECONDS", 60)
	if err != nil {
		return nil, err
	}

	// Настройки базы данных
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort, err := getEnvInt("DB_PORT", 5432)
	if err != nil {
		return nil, err
	}
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "moshosp")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	dbMaxOpenConns, err := getEnvInt("DB_MAX_OPEN_CONNS", 25)
	if err != nil {
		return nil, err
	}

	dbMaxIdleConns, err := getEnvInt("DB_MAX_IDLE_CONNS", 5)
	if err != nil {
		return nil, err
	}

	dbConnMaxLifetimeMinutes, err := getEnvInt("DB_CONN_MAX_LIFETIME_MINUTES", 30)
	if err != nil {
		return nil, err
	}

	cfg.DB = DatabaseConfig{
		Host:                   dbHost,
		Port:                   dbPort,
		User:                   dbUser,
		Password:               dbPassword,
		Name:                   dbName,
		SSLMode:                dbSSLMode,
		MaxOpenConns:           dbMaxOpenConns,
		MaxIdleConns:           dbMaxIdleConns,
		ConnMaxLifetimeMinutes: dbConnMaxLifetimeMinutes,
	}

	// Настройки JWT
	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		return nil, errors.New("JWT_SECRET не может быть пустым")
	}

	jwtExpiryHours, err := getEnvInt("JWT_EXPIRY_HOURS", 24)
	if err != nil {
		return nil, err
	}

	cfg.JWT = JWTConfig{
		Secret:      jwtSecret,
		ExpiryHours: jwtExpiryHours,
	}

	// Настройки метрик
	cfg.MetricsEnabled, err = getEnvBool("METRICS_ENABLED", true)
	if err != nil {
		return nil, err
	}

	cfg.MetricsPath = getEnv("METRICS_PATH", "/metrics")

	// Режим работы приложения
	cfg.AppEnv = getEnv("APP_ENV", "development")

	return &cfg, nil
}

// getEnv возвращает значение переменной окружения или значение по умолчанию
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvInt преобразует строковое значение переменной окружения в int
func getEnvInt(key string, defaultValue int) (int, error) {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue, nil
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return 0, errors.New("неверный формат переменной " + key)
	}

	return value, nil
}

// getEnvBool преобразует строковое значение переменной окружения в bool
func getEnvBool(key string, defaultValue bool) (bool, error) {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue, nil
	}

	valueStr = strings.ToLower(valueStr)
	if valueStr == "true" || valueStr == "1" || valueStr == "yes" {
		return true, nil
	} else if valueStr == "false" || valueStr == "0" || valueStr == "no" {
		return false, nil
	}

	return false, errors.New("неверный формат переменной " + key)
}

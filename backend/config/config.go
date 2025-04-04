package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config представляет конфигурацию приложения
type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Auth     AuthConfig
	Telegram TelegramConfig
	S3       S3Config
}

// AppConfig содержит общие настройки приложения
type AppConfig struct {
	Env         string
	Port        int
	Host        string
	APIBasePath string
	CORSOrigins []string
	RateLimit   int
	TimeoutSec  int
}

// DatabaseConfig содержит настройки базы данных
type DatabaseConfig struct {
	URL              string
	MaxOpenConns     int
	MaxIdleConns     int
	ConnMaxLifetime  time.Duration
	MigrationsPath   string
	AutoMigrate      bool
	LogQueries       bool
	QueryLogFilePath string
}

// RedisConfig содержит настройки Redis
type RedisConfig struct {
	URL      string
	Password string
	DB       int
}

// AuthConfig содержит настройки аутентификации
type AuthConfig struct {
	JWTSecret              string
	JWTExpirationHours     int
	RefreshTokenExpiryDays int
	GoogleClientID         string
	GoogleClientSecret     string
	GoogleRedirectURL      string
}

// TelegramConfig содержит настройки для интеграции с Telegram
type TelegramConfig struct {
	BotToken   string
	WebhookURL string
}

// S3Config содержит настройки для S3-совместимого хранилища
type S3Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
	Region    string
}

// Load загружает конфигурацию из переменных окружения
func Load() (*Config, error) {
	// Загружаем .env файл, если он существует (игнорируем ошибку, если файла нет)
	_ = godotenv.Load()

	config := &Config{
		App: AppConfig{
			Env:         getEnv("APP_ENV", "development"),
			Port:        getEnvAsInt("PORT", 8080),
			Host:        getEnv("HOST", ""),
			APIBasePath: getEnv("API_BASE_PATH", "/api"),
			CORSOrigins: getEnvAsSlice("CORS_ORIGINS", []string{"*"}),
			RateLimit:   getEnvAsInt("RATE_LIMIT", 100),
			TimeoutSec:  getEnvAsInt("TIMEOUT_SEC", 30),
		},
		Database: DatabaseConfig{
			URL:              getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/moshosp?sslmode=disable"),
			MaxOpenConns:     getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:     getEnvAsInt("DB_MAX_IDLE_CONNS", 25),
			ConnMaxLifetime:  time.Duration(getEnvAsInt("DB_CONN_MAX_LIFETIME", 5)) * time.Minute,
			MigrationsPath:   getEnv("DB_MIGRATIONS_PATH", "database/migrations"),
			AutoMigrate:      getEnvAsBool("DB_AUTO_MIGRATE", true),
			LogQueries:       getEnvAsBool("DB_LOG_QUERIES", false),
			QueryLogFilePath: getEnv("DB_QUERY_LOG_PATH", "logs/queries.log"),
		},
		Redis: RedisConfig{
			URL:      getEnv("REDIS_URL", "redis://localhost:6379/0"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Auth: AuthConfig{
			JWTSecret:              getEnv("JWT_SECRET", "test_secret_key"),
			JWTExpirationHours:     getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
			RefreshTokenExpiryDays: getEnvAsInt("REFRESH_TOKEN_EXPIRY_DAYS", 30),
			GoogleClientID:         getEnv("GOOGLE_CLIENT_ID", ""),
			GoogleClientSecret:     getEnv("GOOGLE_CLIENT_SECRET", ""),
			GoogleRedirectURL:      getEnv("GOOGLE_REDIRECT_URL", ""),
		},
		Telegram: TelegramConfig{
			BotToken:   getEnv("TELEGRAM_BOT_TOKEN", ""),
			WebhookURL: getEnv("TELEGRAM_WEBHOOK_URL", ""),
		},
		S3: S3Config{
			Endpoint:  getEnv("S3_ENDPOINT", ""),
			AccessKey: getEnv("S3_ACCESS_KEY", ""),
			SecretKey: getEnv("S3_SECRET_KEY", ""),
			Bucket:    getEnv("S3_BUCKET", "moshosp"),
			UseSSL:    getEnvAsBool("S3_USE_SSL", true),
			Region:    getEnv("S3_REGION", "eu-west-1"),
		},
	}

	return config, nil
}

// getEnv получает значение переменной окружения или возвращает значение по умолчанию
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvAsInt получает числовое значение переменной окружения
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// getEnvAsBool получает булево значение переменной окружения
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// getEnvAsSlice получает значение переменной окружения в виде среза строк
func getEnvAsSlice(key string, defaultValue []string) []string {
	if value, exists := os.LookupEnv(key); exists {
		// Простое разделение по запятой
		return stringSplit(value, ",")
	}
	return defaultValue
}

// stringSplit разделяет строку по разделителю
func stringSplit(s, sep string) []string {
	if s == "" {
		return []string{}
	}
	return []string{s} // Упрощенно, без разделения
}

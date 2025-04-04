module moshosp/backend

go 1.21

require (
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/go-chi/chi/v5 v5.0.12
	github.com/go-chi/cors v1.2.1
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/google/uuid v1.6.0
	github.com/jmoiron/sqlx v1.3.5
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9
	github.com/sirupsen/logrus v1.9.3
)

require (
	github.com/mattn/go-sqlite3 v1.14.16 // indirect
	github.com/stretchr/testify v1.8.3 // indirect
	golang.org/x/sys v0.18.0 // indirect
)

replace github.com/kalin/moshosp/backend/internal/repository => ./internal/repository

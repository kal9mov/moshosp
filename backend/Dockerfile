FROM golang:1.21-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходники
COPY . .

# Собираем бинарник
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o moshosp ./cmd/api

# Финальный образ
FROM alpine:3.18

WORKDIR /app

# Устанавливаем зависимости
RUN apk --no-cache add ca-certificates tzdata

# Копируем бинарник из builder
COPY --from=builder /app/moshosp .

# Копируем миграции
COPY --from=builder /app/database/migrations ./database/migrations

# Копируем шаблоны и статические файлы
COPY --from=builder /app/resources ./resources

# Порт API
EXPOSE 8080

# Запускаем приложение
CMD ["/app/moshosp"] 
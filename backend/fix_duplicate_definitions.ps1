# Скрипт для исправления дублирующихся определений

# Устанавливаем параметры
$backendDir = "C:\kalin\moshosp\backend"

# Функция для вывода шагов
function Write-Step {
    param (
        [string]$Message
    )
    Write-Host "`n>> $Message" -ForegroundColor Cyan
}

# Предупреждение
Write-Host "ВНИМАНИЕ: Этот скрипт исправит дублирующиеся определения в проекте." -ForegroundColor Yellow
Write-Host "Рекомендуется создать резервную копию проекта перед продолжением." -ForegroundColor Yellow

$confirmation = Read-Host "Хотите продолжить? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Операция отменена." -ForegroundColor Red
    exit
}

# Исправляем конфликт между models\requestdto.go и models\game.go
Write-Step "Исправление дублирования в моделях"

$requestdtoPath = Join-Path -Path $backendDir -ChildPath "internal\domain\models\requestdto.go"
if (Test-Path $requestdtoPath) {
    # Создаем новый файл без дублирующихся определений
    $content = @'
package models

// RefreshTokenInput представляет запрос на обновление токена
type RefreshTokenInput struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// MarkNotificationReadInput представляет запрос на пометку уведомления как прочитанного
type MarkNotificationReadInput struct {
	NotificationID string `json:"notification_id" validate:"required"`
}

// RegisterDeviceInput представляет запрос на регистрацию устройства для пуш-уведомлений
type RegisterDeviceInput struct {
	DeviceToken string `json:"device_token" validate:"required"`
	DeviceType  string `json:"device_type" validate:"required,oneof=ios android web"`
}

// ErrorResponse представляет стандартный формат ответа с ошибкой
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}

// StatusResponse представляет стандартный формат ответа со статусом
type StatusResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}
'@
    
    # Сохраняем результат
    Set-Content -Path $requestdtoPath -Value $content
    Write-Host "Файл обновлен: $requestdtoPath" -ForegroundColor Green
}

# Исправляем конфликт с Repository
$repositoryPath = Join-Path -Path $backendDir -ChildPath "internal\database\repository.go"
if (Test-Path $repositoryPath) {
    # Создаем пустой файл repository.go
    $content = @'
// This file is intentionally left empty
// All definitions have been moved to queries.go

package database
'@
    Set-Content -Path $repositoryPath -Value $content
    Write-Host "Обновлен файл: $repositoryPath" -ForegroundColor Green
}

# Исправляем путь импорта в main.go
Write-Step "Обновление импортов в main.go"

$mainPath = Join-Path -Path $backendDir -ChildPath "cmd\api\main.go"
if (Test-Path $mainPath) {
    $content = Get-Content -Path $mainPath -Raw
    $updatedContent = $content -replace "moshosp/backend", "github.com/kal9mov/moshosp/backend"
    Set-Content -Path $mainPath -Value $updatedContent
    Write-Host "Обновлен файл: $mainPath" -ForegroundColor Green
}

# Запускаем go mod tidy для исправления зависимостей
Write-Step "Запуск go mod tidy"
Set-Location -Path $backendDir
& go mod tidy

# Завершение
Write-Step "Готово!"
Write-Host "Дублирующиеся определения исправлены." -ForegroundColor Green
Write-Host "`nСледующие шаги:" -ForegroundColor Yellow
Write-Host "1. Зафиксируйте изменения в Git:" -ForegroundColor Yellow
Write-Host "   cd C:\kalin\moshosp" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'Fix duplicate definitions'" -ForegroundColor Yellow
Write-Host "   git push" -ForegroundColor Yellow
Write-Host "`n2. Соберите проект:" -ForegroundColor Yellow
Write-Host "   cd C:\kalin\moshosp\backend\cmd\api" -ForegroundColor Yellow
Write-Host "   go build" -ForegroundColor Yellow 
# Скрипт для исправления повторяющихся определений в проекте

# Параметры
$backendDir = "C:\kalin\moshosp\backend"

# Функция для вывода информации
function Write-Step {
    param (
        [string] $Message
    )
    Write-Host ""
    Write-Host "===== $Message =====" -ForegroundColor Cyan
}

# Предупреждение
Write-Step "Исправление повторяющихся определений"
Write-Host "Этот скрипт исправит конфликты с дублирующимися определениями в проекте." -ForegroundColor Yellow
Write-Host "ВНИМАНИЕ: Рекомендуется сделать резервную копию проекта перед запуском!" -ForegroundColor Red
Write-Host "Продолжить? (y/n)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "y") {
    Write-Host "Операция отменена" -ForegroundColor Red
    exit
}

# 1. Исправление конфликта между models\requestdto.go и models\game.go
Write-Step "Исправление конфликта в models"

$requestdtoPath = "$backendDir\internal\domain\models\requestdto.go"
if (Test-Path $requestdtoPath) {
    # Переименовываем файл, добавляя .bak
    Rename-Item -Path $requestdtoPath -NewName "requestdto.go.bak" -Force
    Write-Host "Переименован файл: $requestdtoPath -> requestdto.go.bak" -ForegroundColor Green
}

# 2. Исправление конфликта между database\repository.go и database\queries.go
Write-Step "Исправление конфликта в database"

$repositoryPath = "$backendDir\internal\database\repository.go" 
if (Test-Path $repositoryPath) {
    # Переименовываем файл, добавляя .bak
    Rename-Item -Path $repositoryPath -NewName "repository.go.bak" -Force
    Write-Host "Переименован файл: $repositoryPath -> repository.go.bak" -ForegroundColor Green
}

Write-Step "Создание новых файлов"

# Создаем новый requestdto.go без конфликтующих определений
$newRequestdtoContent = @"
package models

// Здесь только определения, которые не конфликтуют с другими файлами
// AddExperienceInput и UnlockAchievementInput перемещены в game.go

// PaginatedRequest представляет запрос с пагинацией
type PaginatedRequest struct {
    Page  int `json:"page" form:"page"`
    Limit int `json:"limit" form:"limit"`
}

// Определите другие нужные структуры, не перекрывающиеся с game.go
"@

$newRequestdtoPath = "$backendDir\internal\domain\models\requestdto.go"
Set-Content -Path $newRequestdtoPath -Value $newRequestdtoContent -NoNewline
Write-Host "Создан файл: $newRequestdtoPath" -ForegroundColor Green

# Создаем новый repository.go в database без конфликтующих определений
$newRepositoryContent = @"
package database

// Здесь только определения, которые не конфликтуют с queries.go
// Repository и NewRepository перемещены в queries.go

// Определите другие функции и типы, которые не перекрываются с queries.go
"@

$newRepositoryPath = "$backendDir\internal\database\repository.go"
Set-Content -Path $newRepositoryPath -Value $newRepositoryContent -NoNewline
Write-Host "Создан файл: $newRepositoryPath" -ForegroundColor Green

# Инструкции для завершения процесса
Write-Step "Следующие шаги"
Write-Host "1. Если вы используете систему контроля версий (git):" -ForegroundColor Yellow
Write-Host "   git add ."
Write-Host "   git commit -m ""Fix duplicate definitions"""
Write-Host ""
Write-Host "2. Соберите проект:"
Write-Host "   cd $backendDir\cmd\api"
Write-Host "   go build"
Write-Host ""
Write-Host "3. Если остаются ошибки компиляции, проверьте .bak файлы и перенесите оттуда уникальные определения."
Write-Host ""
Write-Host "Готово!" -ForegroundColor Green 
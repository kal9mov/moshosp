# Скрипт для подготовки проекта к публикации на GitHub
# Решает проблемы с импортами и повторяющимися определениями

# Параметры
param (
    [string]$projectRoot = "C:\kalin\moshosp",
    [string]$backendDir = "C:\kalin\moshosp\backend",
    [string]$oldImportPrefix = "moshosp/backend",
    [string]$newImportPrefix = "github.com/kal9mov/moshosp/backend"
)

# Функция для вывода информации
function Write-Step {
    param (
        [string]$Message
    )
    Write-Host "`n>> $Message" -ForegroundColor Cyan
}

# Предупреждение
Write-Host "ВНИМАНИЕ: Этот скрипт подготовит проект для публикации на GitHub." -ForegroundColor Yellow
Write-Host "Рекомендуется создать резервную копию проекта перед продолжением." -ForegroundColor Yellow
Write-Host "Будут изменены пути импорта и файлы go.mod." -ForegroundColor Yellow

$confirmation = Read-Host "Хотите продолжить? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Операция отменена." -ForegroundColor Red
    exit
}

# Шаг 1: Обновление go.mod в корне проекта
Write-Step "Обновление go.mod в корне проекта"
$rootGoModPath = Join-Path -Path $projectRoot -ChildPath "go.mod"
if (Test-Path $rootGoModPath) {
    $content = Get-Content -Path $rootGoModPath -Raw
    $newContent = $content -replace "module\s+\S+", "module github.com/kal9mov/moshosp"
    Set-Content -Path $rootGoModPath -Value $newContent
    Write-Host "Обновлен файл: $rootGoModPath" -ForegroundColor Green
}

# Шаг 2: Обновление go.mod в директории backend
Write-Step "Обновление go.mod в директории backend"
$backendGoModPath = Join-Path -Path $backendDir -ChildPath "go.mod"
if (Test-Path $backendGoModPath) {
    $content = Get-Content -Path $backendGoModPath -Raw
    $newContent = $content -replace "module\s+\S+", "module github.com/kal9mov/moshosp/backend"
    Set-Content -Path $backendGoModPath -Value $newContent
    Write-Host "Обновлен файл: $backendGoModPath" -ForegroundColor Green
}

# Шаг 3: Замена путей импорта во всех .go файлах
Write-Step "Замена путей импорта во всех .go файлах"
$goFiles = Get-ChildItem -Path $backendDir -Filter "*.go" -Recurse
$updatedFiles = 0

foreach ($file in $goFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match $oldImportPrefix) {
        $newContent = $content -replace $oldImportPrefix, $newImportPrefix
        Set-Content -Path $file.FullName -Value $newContent
        $updatedFiles++
        Write-Host "Обновлен файл: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "Всего обновлено файлов: $updatedFiles" -ForegroundColor Green

# Шаг 4: Запуск go mod tidy для исправления зависимостей
Write-Step "Запуск go mod tidy для исправления зависимостей"
Set-Location -Path $backendDir
$result = & go mod tidy
Write-Host $result

# Завершение
Write-Step "Подготовка проекта завершена"
Write-Host "Проверьте следующие файлы на наличие дублирующихся определений:" -ForegroundColor Yellow
Write-Host " - models\requestdto.go и models\game.go (AddExperienceInput, UnlockAchievementInput и т.д.)" -ForegroundColor Yellow
Write-Host " - models\responsedto.go" -ForegroundColor Yellow
Write-Host " - database\repository.go и database\queries.go (Repository, NewRepository и т.д.)" -ForegroundColor Yellow
Write-Host "`nЗатем:" -ForegroundColor Green
Write-Host "1. Создайте репозиторий на GitHub с именем 'moshosp'" -ForegroundColor Green
Write-Host "2. Инициализируйте Git репозиторий и отправьте код:" -ForegroundColor Green
Write-Host "cd $projectRoot" -ForegroundColor Green
Write-Host "git init" -ForegroundColor Green
Write-Host "git add ." -ForegroundColor Green
Write-Host "git commit -m 'Initial commit'" -ForegroundColor Green
Write-Host "git remote add origin https://github.com/kal9mov/moshosp.git" -ForegroundColor Green
Write-Host "git push -u origin master" -ForegroundColor Green
Write-Host "`n3. Соберите проект:" -ForegroundColor Green
Write-Host "cd $backendDir\cmd\api" -ForegroundColor Green
Write-Host "go build" -ForegroundColor Green 
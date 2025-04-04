# Скрипт для подготовки проекта к публикации на GitHub
# Решает проблемы с импортами и повторяющимися определениями

# Параметры
$projectRoot = "C:\kalin\moshosp"
$backendDir = "$projectRoot\backend"
$oldImportPrefix = "moshosp/backend"
$newImportPrefix = "github.com/kalin/moshosp/backend"

# Функция для вывода информации
function Write-Step {
    param (
        [string] $Message
    )
    Write-Host ""
    Write-Host "===== $Message =====" -ForegroundColor Cyan
}

# Предупреждение
Write-Step "Подготовка проекта для GitHub"
Write-Host "Этот скрипт исправит импорты и подготовит проект для публикации на GitHub." -ForegroundColor Yellow
Write-Host "Все импорты '$oldImportPrefix' будут заменены на '$newImportPrefix'" -ForegroundColor Yellow
Write-Host ""
Write-Host "ВНИМАНИЕ: Рекомендуется сделать резервную копию проекта перед запуском!" -ForegroundColor Red
Write-Host "Продолжить? (y/n)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "y") {
    Write-Host "Операция отменена" -ForegroundColor Red
    exit
}

# 1. Обновление go.mod файлов
Write-Step "Обновление go.mod файлов"

# Обновление go.mod в корне проекта
$rootGoModPath = "$projectRoot\go.mod"
if (Test-Path $rootGoModPath) {
    $rootGoModContent = Get-Content $rootGoModPath -Raw
    $rootGoModContent = $rootGoModContent -replace "module\s+\S+", "module github.com/kalin/moshosp"
    Set-Content -Path $rootGoModPath -Value $rootGoModContent -NoNewline
    Write-Host "Обновлен файл: $rootGoModPath" -ForegroundColor Green
}

# Обновление go.mod в backend
$backendGoModPath = "$backendDir\go.mod"
if (Test-Path $backendGoModPath) {
    $backendGoModContent = Get-Content $backendGoModPath -Raw
    $backendGoModContent = $backendGoModContent -replace "module\s+\S+", "module github.com/kalin/moshosp/backend"
    Set-Content -Path $backendGoModPath -Value $backendGoModContent -NoNewline
    Write-Host "Обновлен файл: $backendGoModPath" -ForegroundColor Green
}

# 2. Замена импортов во всех .go файлах
Write-Step "Замена импортов в Go файлах"

$goFiles = Get-ChildItem -Path $projectRoot -Filter "*.go" -Recurse
$replacedFileCount = 0

foreach ($file in $goFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    if ($content -match $oldImportPrefix) {
        $newContent = $content -replace "import\s+\(\s+", "import (`n" -replace """$oldImportPrefix", """$newImportPrefix"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $replacedFileCount++
        Write-Host "Обновлен файл: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "Всего обновлено файлов: $replacedFileCount" -ForegroundColor Green

# 3. Исправление повторяющихся определений
Write-Step "Исправление повторяющихся определений"

# Выполнение go mod tidy
Set-Location $backendDir
Write-Host "Выполнение 'go mod tidy'..." -ForegroundColor Yellow
Invoke-Expression "go mod tidy"

# Инструкции для завершения процесса
Write-Step "Следующие шаги"
Write-Host "1. Проверьте файлы с повторяющимися определениями и исправьте их вручную:" -ForegroundColor Yellow
Write-Host "   - models\requestdto.go и models\game.go (AddExperienceInput, UnlockAchievementInput)"
Write-Host "   - models\responsedto.go и models\requestdto.go (PaginatedResponse)"
Write-Host "   - database\repository.go и database\queries.go (Repository, NewRepository)"
Write-Host ""
Write-Host "2. Создайте репозиторий на GitHub:"
Write-Host "   - Репозиторий: github.com/kalin/moshosp"
Write-Host ""
Write-Host "3. Опубликуйте код:"
Write-Host "   git init"
Write-Host "   git add ."
Write-Host "   git commit -m ""Initial commit"""
Write-Host "   git remote add origin https://github.com/kalin/moshosp.git"
Write-Host "   git push -u origin master"
Write-Host ""
Write-Host "4. Соберите проект:"
Write-Host "   cd backend/cmd/api"
Write-Host "   go build"
Write-Host ""
Write-Host "Готово!" -ForegroundColor Green 
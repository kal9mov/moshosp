# Скрипт для исправления импортов в Go файлах
# Заменяет github.com/kalin/moshosp/backend на moshosp/backend во всех .go файлах

$projectPath = "C:\kalin\moshosp\backend"
$importPattern = "github.com/kalin/moshosp/backend"
$replacement = "moshosp/backend"

Write-Host "Этот скрипт заменит все пути импортов в проекте:" -ForegroundColor Cyan
Write-Host "С: $importPattern" -ForegroundColor Yellow
Write-Host "На: $replacement" -ForegroundColor Green
Write-Host ""
Write-Host "Заменить все импорты? (y/n)" -ForegroundColor Cyan
$confirm = Read-Host

if ($confirm -ne "y") {
    Write-Host "Операция отменена" -ForegroundColor Red
    exit
}

# Получаем все .go файлы в проекте
$goFiles = Get-ChildItem -Path $projectPath -Filter "*.go" -Recurse

# Счетчики
$processedFiles = 0
$modifiedFiles = 0

# Проходим по каждому файлу и заменяем импорты
foreach ($file in $goFiles) {
    $processedFiles++
    $content = Get-Content -Path $file.FullName -Raw
    
    # Проверяем, содержит ли файл целевую строку
    if ($content -match $importPattern) {
        Write-Host "Обрабатываю файл: $($file.FullName)" -ForegroundColor Yellow
        
        # Заменяем импорты в содержимом файла
        $newContent = $content -replace $importPattern, $replacement
        
        # Проверяем, были ли реальные изменения
        if ($newContent -ne $content) {
            # Записываем изменения обратно в файл
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            $modifiedFiles++
            Write-Host "  Файл обновлен" -ForegroundColor Green
        } else {
            Write-Host "  Нет изменений" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Замена импортов завершена:" -ForegroundColor Cyan
Write-Host "- Обработано файлов: $processedFiles" -ForegroundColor White
Write-Host "- Изменено файлов: $modifiedFiles" -ForegroundColor Green
Write-Host ""
Write-Host "Дальнейшие действия:" -ForegroundColor Cyan
Write-Host "1. Запустите 'go mod tidy' в директории backend" -ForegroundColor White
Write-Host "2. Выполните 'go build' в директории cmd/api" -ForegroundColor White 
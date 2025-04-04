$projectPath = "C:\kalin\moshosp\backend"
$importPattern = 'moshosp/'
$replacement = 'github.com/kalin/moshosp/backend/'

# Получаем все .go файлы в проекте
$goFiles = Get-ChildItem -Path $projectPath -Filter "*.go" -Recurse

# Проходим по каждому файлу и заменяем импорты
foreach ($file in $goFiles) {
    $content = Get-Content -Path $file.FullName -Raw

    # Проверяем, содержит ли файл целевую строку
    if ($content -match $importPattern) {
        Write-Host "Обрабатываю файл: $($file.FullName)"
        
        # Заменяем импорты в содержимом файла
        $newContent = $content -replace "import \(`n", "import (`n" -replace """$importPattern", """$replacement"
        
        # Записываем изменения обратно в файл
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        
        Write-Host "Файл обновлен: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "Замена импортов завершена." -ForegroundColor Cyan
Write-Host "Запустите 'go mod tidy' и 'go build' для проверки результатов." -ForegroundColor Cyan 
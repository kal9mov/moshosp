# Скрипт для исправления импортов в Go файлах
# Заменяет moshosp/backend/ на github.com/kalin/moshosp/backend/ во всех .go файлах

Write-Host "Этот скрипт исправит все пути импорта в проекте"
Write-Host "Будет выполнена замена 'moshosp/backend/' на 'github.com/kalin/moshosp/backend/'"
Write-Host "Заменить все импорты? (y/n)"
$confirm = Read-Host

if ($confirm -ne "y") {
    Write-Host "Операция отменена"
    exit 0
}

Write-Host "Исправляю импорты..."

# Получаем все .go файлы и заменяем строки
Get-ChildItem -Recurse -Filter "*.go" | ForEach-Object {
    Write-Host "Обрабатываю файл: $($_.FullName)"
    (Get-Content $_.FullName) -replace '"moshosp/backend/', '"github.com/kalin/moshosp/backend/' | Set-Content $_.FullName
}

Write-Host "Импорты исправлены"
Write-Host "Теперь выполните 'go mod tidy' в директории backend для обновления зависимостей" 
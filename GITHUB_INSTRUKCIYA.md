# Инструкция по публикации проекта на GitHub

## Подготовка

Для долгосрочного решения проблемы с импортами и циклическими зависимостями, необходимо разместить проект на GitHub и использовать правильные пути импорта.

### 1. Создайте репозиторий на GitHub

1. Перейдите на [GitHub](https://github.com) и войдите в аккаунт
2. Нажмите "New repository" (Новый репозиторий)
3. Введите название репозитория: `moshosp`
4. Выберите "Public" или "Private" в зависимости от ваших предпочтений
5. Нажмите "Create repository"

### 2. Инициализируйте локальный Git-репозиторий

```bash
cd C:\kalin\moshosp
git init
git add .
git commit -m "Первоначальный коммит"
```

### 3. Измените go.mod файлы

1. В корне проекта:
```
module github.com/kalin/moshosp
```

2. В директории backend:
```
module github.com/kalin/moshosp/backend
```

### 4. Замените импорты

Используйте скрипт для автоматической замены импортов:

```powershell
# PowerShell
Get-ChildItem -Path "C:\kalin\moshosp" -Filter "*.go" -Recurse | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    if ($content -match "moshosp/backend") {
        Write-Host "Обрабатываю файл: $($_.FullName)"
        $newContent = $content -replace "moshosp/backend", "github.com/kalin/moshosp/backend"
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
    }
}
```

### 5. Привяжите и опубликуйте репозиторий

```bash
git remote add origin https://github.com/kalin/moshosp.git
git push -u origin master
```

### 6. Восстановите зависимости и постройте проект

```bash
cd C:\kalin\moshosp\backend
go mod tidy
cd cmd/api
go build
```

## Альтернативное решение

Если вы не хотите или не можете создать GitHub репозиторий, мы уже сделали изменения, использующие интерфейсы вместо конкретных типов в структуре Repository. Это должно помочь избежать циклических зависимостей.

Для завершения этого подхода, убедитесь что в вашем проекте:

1. repository.go содержит интерфейсы вместо конкретных типов
2. main.go правильно инициализирует репозитории через интерфейсы
3. services используют репозитории через интерфейсы

## Рекомендация

После размещения проекта на GitHub, рекомендуется добавить файл `go.work` в корне проекта для удобной локальной разработки:

```bash
cd C:\kalin\moshosp
go work init
go work use ./backend
```

Это позволит использовать модуль локально без необходимости публикации обновлений на GitHub при каждом изменении. 
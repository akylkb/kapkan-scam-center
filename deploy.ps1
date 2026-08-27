# Остановка выполнения при появлении ошибок
$ErrorActionPreference = "Stop"

Write-Host ">>> Запуск Git Pull..." -ForegroundColor Cyan
git pull

Write-Host ">>> Сборка проекта (npm run build)..." -ForegroundColor Cyan
npm run build

Write-Host ">>> Запуск сервера (npm start)..." -ForegroundColor Green
npm start
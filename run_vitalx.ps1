# VITAL-X Launch Helper Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "  VITAL-X SIH26047 Launch Helper" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Starting Backend FastApi Server (localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; python -m uvicorn app.main:app --reload --port 8000"

Write-Host "[2/2] Starting Frontend Next.js Dev Server (localhost:3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`nBoth VITAL-X processes launched in separate windows!" -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser to view the application." -ForegroundColor Yellow

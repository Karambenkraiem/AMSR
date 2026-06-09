# Script de démarrage développement AMSR
Write-Host "=== Démarrage de l'environnement AMSR ===" -ForegroundColor Cyan

# Démarrer PostgreSQL via Docker
Write-Host "1. Démarrage de la base de données PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d postgres
Start-Sleep -Seconds 3

# Initialiser Prisma et appliquer le schéma
Write-Host "2. Application du schéma Prisma..." -ForegroundColor Yellow
Set-Location backend
npx prisma db push
Write-Host "3. Initialisation des données de test..." -ForegroundColor Yellow
node prisma/seed.js
Set-Location ..

Write-Host "4. Démarrage du backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "5. Démarrage du frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'frontend'; npm run dev"

Write-Host ""
Write-Host "=== Application démarrée ===" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5175" -ForegroundColor White
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host ""
Write-Host "Comptes de test (mot de passe: Admin@2024):" -ForegroundColor White
Write-Host "  admin@steg.com.tn         -> Administrateur" -ForegroundColor Gray
Write-Host "  ctravaux@steg.com.tn      -> Chargé de Travaux" -ForegroundColor Gray
Write-Host "  cconsignation@steg.com.tn -> Chargé de Consignation" -ForegroundColor Gray
Write-Host "  cexploitation@steg.com.tn -> Chargé d'Exploitation" -ForegroundColor Gray

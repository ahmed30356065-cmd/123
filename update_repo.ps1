# Repository Update Script
# This script updates the GitHub repository with the latest changes

param(
    [string]$CommitMessage = "Update application"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GOO NOW - Repository Update Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$ProjectDir = "c:\Users\HP\OneDrive\Desktop\GOO"
Set-Location $ProjectDir

Write-Host "[1/5] Checking Git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "[2/5] Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "[3/5] Committing changes..." -ForegroundColor Yellow
Write-Host "Commit message: $CommitMessage" -ForegroundColor Gray
git commit -m $CommitMessage

Write-Host ""
Write-Host "[4/5] Pulling latest changes from remote..." -ForegroundColor Yellow
git pull origin main --rebase

Write-Host ""
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Repository updated successfully!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "APK Location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
Write-Host "APK Size: 5.31 MB" -ForegroundColor Cyan
Write-Host ""

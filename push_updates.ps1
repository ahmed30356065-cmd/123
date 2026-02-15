# Repository Update Script (Dynamic Path)
# This script updates the GitHub repository with the latest changes from the CURRENT folder

param(
    [string]$CommitMessage = "Update application logic and UI"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GOO NOW - Repository Update Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Use Current Directory (Where the changes actually are)
$ProjectDir = Get-Location
Write-Host "Working Directory: $ProjectDir" -ForegroundColor Gray

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
Write-Host "[4/5] Pulling latest changes from remote (Rebase)..." -ForegroundColor Yellow
try {
    git pull origin main --rebase
} catch {
    Write-Host "Pull failed. Check network or conflicts." -ForegroundColor Red
}

Write-Host ""
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
try {
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Repository updated successfully!  " -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        throw "Push failed"
    }
} catch {
    Write-Host "Push failed. You might need to resolve conflicts." -ForegroundColor Red
}

Pause

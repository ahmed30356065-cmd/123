# Git Push Script - Automates adding, committing, and pushing changes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GIT PUSH AUTOMATION   " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in PATH." -ForegroundColor Red
    Pause
    Exit
}

# 2. Check status
Write-Host "Checking Git Status..." -ForegroundColor Gray
git status
Write-Host ""

# 3. Add all changes
Write-Host "Adding all changes..." -ForegroundColor Green
git add .

# 4. Commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$defaultMsg = "Updates: Payment Modal UI & Merchant Order Form Layout ($timestamp)"
$commitMsg = Read-Host "Enter commit message (Press Enter for default: '$defaultMsg')"

if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = $defaultMsg
}

Write-Host "Committing with message: $commitMsg" -ForegroundColor Green
git commit -m "$commitMsg"

# 5. Push
Write-Host "Pushing to remote..." -ForegroundColor Green
try {
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   PUSH SUCCESSFUL!   " -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        throw "Push failed"
    }
} catch {
    Write-Host ""
    Write-Host "Push failed. You might need to pull first or check credentials." -ForegroundColor Red
    Write-Host "Try running: git pull --rebase" -ForegroundColor Yellow
}

Pause

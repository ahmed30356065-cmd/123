Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FULL BUILD (WEB + ANDROID)   " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build Web Assets
Write-Host "[1/3] Building Web App (npm run build)..." -ForegroundColor Green
# Try to run npm. If it fails, we check availability.
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
} catch {
    Write-Host "Error: 'npm' command failed or not found." -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed and 'npm' is in your PATH." -ForegroundColor Yellow
    Write-Host "Trying local npx vite build..." -ForegroundColor Yellow
    try {
        npx vite build
        if ($LASTEXITCODE -ne 0) { throw "vite build failed" }
    } catch {
        Write-Host "Web build failed. Cannot proceed with new changes." -ForegroundColor Red
        Pause
        Exit
    }
}

Write-Host "Web Build Success!" -ForegroundColor Cyan
Write-Host ""

# 2. Sync Capacitor
Write-Host "[2/3] Syncing with Android..." -ForegroundColor Green
try {
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }
} catch {
    Write-Host "Sync failed. Continuing anyway to APK build..." -ForegroundColor Yellow
}
Write-Host "Sync Completed." -ForegroundColor Cyan
Write-Host ""

# 3. Build APK
Write-Host "[3/3] Building APK..." -ForegroundColor Green
if (Test-Path "android") {
    Set-Location android
    if (Test-Path "gradlew.bat") {
        .\gradlew.bat assembleRelease
    } else {
        Write-Host "gradlew.bat not found in android folder!" -ForegroundColor Red
        Pause
        Exit
    }
    Set-Location ..
} else {
    Write-Host "Android folder not found!" -ForegroundColor Red
    Pause
    Exit
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   FULL BUILD SUCCESS!   " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    $apkPath = "android\app\build\outputs\apk\release"
    Write-Host "APK Location: $apkPath" -ForegroundColor Yellow
    
    if (Test-Path $apkPath) {
        Invoke-Item $apkPath
    }
} else {
    Write-Host "APK Build Failed." -ForegroundColor Red
}

Pause

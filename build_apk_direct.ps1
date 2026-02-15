Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIRECT APK BUILD (BINA' APK MUBASHARA)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure we are in the project root or android folder correctly
if (Test-Path "android") {
    Set-Location "android"
}

# Check for gradlew.bat
if (Test-Path "gradlew.bat") {
    Write-Host "[1/1] Building Release APK with Gradle..." -ForegroundColor Green
    .\gradlew.bat assembleRelease
} else {
    Write-Host "ERROR: gradlew.bat not found in $(Get-Location)" -ForegroundColor Red
    Write-Host "Please make sure you are running this script from the main project folder."
    Pause
    Exit
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BUILD SUCCESS! (TAM AL-BINA')" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    $apkPath = "app\build\outputs\apk\release"
    Write-Host "APK Location: $apkPath" -ForegroundColor Yellow
    
    if (Test-Path $apkPath) {
        Invoke-Item $apkPath
    } else {
         Write-Host "Folder not found: $apkPath"
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED! (FASHL AL-BINA')" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Pause

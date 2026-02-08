
# Script to Build, Sign, and Encrypt APK
# Usage: ./build_sign_encrypt.ps1

$ErrorActionPreference = "Stop"
$ErrorActionPreference = "Stop"
$version = "32" # Updated to 32
$releaseName = "GOO_NOW_Release_v$version.apk"

Write-Host "========================================"
Write-Host "BUILDING GOO NOW - VERSION $version"
Write-Host "========================================"

# 1. Build Web Assets
Write-Host "`n[1/4] Building Web Assets..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Web build failed"; exit 1 }

# 2. Sync Capacitor
Write-Host "`n[2/4] Syncing Capacitor..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Error "Capacitor sync failed"; exit 1 }

# 3. Build Android APK (Signed via Gradle)
Write-Host "`n[3/4] Building Android Release APK..."
Set-Location android
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) { Write-Error "Gradle build failed"; exit 1 }
Set-Location ..

# 4. Copy APK
$sourceApk = "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $sourceApk)) {
    Write-Error "APK file not found at $sourceApk"
    exit 1
}

Write-Host "`n[4/4] Copying Signed APK..."
Copy-Item $sourceApk $releaseName -Force

Write-Host "`nSUCCESS!"
Write-Host "Signed APK created: $releaseName"
Write-Host "========================================"

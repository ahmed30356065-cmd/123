$ErrorActionPreference = "Stop"

Write-Host "[1/4] Building Web Assets..."
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/4] Syncing Capacitor..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/4] Building Android Release APK..."
Set-Location android
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/4] Copying and Renaming APK..."
$source = "app\build\outputs\apk\release\app-release.apk"
$dest = "..\GOO_NOW_Release_v6.apk"

if (Test-Path $source) {
    Copy-Item $source $dest -Force
    Write-Host "SUCCESS: APK created at $dest"
} else {
    Write-Host "ERROR: APK file not found at $source"
    exit 1
}

Set-Location ..

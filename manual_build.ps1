Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BAD'E AL-BINA' AL-YADAWI (MANUAL BUILD)   " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Install Dependencies
Write-Host "[1/4] Tathbeet al-maktabat (Installing dependencies)..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Khat' fi al-tathbeet (Install failed). Hal tureed al-istimrar?" -ForegroundColor Red
    $confirm = Read-Host "Iy (y) / La (n)"
    if ($confirm -ne 'y') { exit }
}
Write-Host "Tam al-tathbeet binajah (Install Success)." -ForegroundColor Cyan
Write-Host ""

# 2. Build Web App
Write-Host "[2/4] Bina' al-mawq' (Building web app)..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Khat' fi bina' al-web (Web build failed). Hal tureed al-istimrar?" -ForegroundColor Red
    $confirm = Read-Host "Iy (y) / La (n)"
    if ($confirm -ne 'y') { exit }
}
Write-Host "Tam bina' al-web binajah (Web Build Success)." -ForegroundColor Cyan
Write-Host ""

# 3. Sync Capacitor
Write-Host "[3/4] Rabt ma' Android (Syncing with Android)..." -ForegroundColor Green
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Khat' fi al-rabt (Sync failed). Hal tureed al-istimrar?" -ForegroundColor Red
    $confirm = Read-Host "Iy (y) / La (n)"
    if ($confirm -ne 'y') { exit }
}
Write-Host "Tam al-rabt binajah (Sync Success)." -ForegroundColor Cyan
Write-Host ""

# 4. Build APK
Write-Host "[4/4] Bina' malaf APK (Building APK)..." -ForegroundColor Green
Set-Location android
if (Test-Path "gradlew.bat") {
    .\gradlew.bat assembleRelease
} else {
    Write-Host "Malaf gradlew.bat ghayr mawjood!" -ForegroundColor Red
    exit
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   TAM BINA' AL-TATBIQ BINAJAH! (SUCCESS)   " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Masar al-malaf (File Path):"
    Write-Host "android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Fashl fi bina' APK (APK Build Failed)." -ForegroundColor Red
}

Pause

@echo off
echo ========================================
echo DIRECT AP BUILD (BINA' APK MUBASHARA)
echo ========================================
echo.

echo [1/2] Changing directory to android...
cd android

echo [2/2] Building Release APK with Gradle...
if exist gradlew.bat (
    call gradlew.bat assembleRelease
) else (
    echo ERROR: gradlew.bat not found!
    pause
    exit /b 1
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESS! (TAM AL-BINA')
    echo ========================================
    echo.
    echo APK Location:
    echo android\app\build\outputs\apk\release\app-release.apk
    echo.
    explorer "app\build\outputs\apk\release"
) else (
    echo.
    echo ========================================
    echo BUILD FAILED! (FASHL AL-BINA')
    echo ========================================
    echo.
)

pause

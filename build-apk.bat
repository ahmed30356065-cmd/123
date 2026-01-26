@echo off
echo ========================================
echo Building GOO NOW APK
echo ========================================
echo.

REM Navigate to android directory
cd /d "%~dp0android"

REM Check if gradlew exists, if not use gradle
if exist gradlew.bat (
    echo Using gradlew.bat...
    call gradlew.bat assembleRelease
) else (
    echo gradlew.bat not found, trying gradle...
    gradle assembleRelease
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build SUCCESS!
    echo ========================================
    echo.
    echo APK Location: android\app\build\outputs\apk\release\app-release.apk
    echo.
) else (
    echo.
    echo ========================================
    echo Build FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
)

pause

@echo off
chcp 65001 > nul
echo --------------------------------------------
echo 🚀 STARTING EXPORT FOR PROJECT 123
echo --------------------------------------------

set "PROJECT_ROOT=C:\Users\HP\Desktop\MyProjects\123"
set "EXPORT_DIR=%USERPROFILE%\Desktop\Sketchware_Project_123"

:: 1. Navigate to Project Folder
if exist "%PROJECT_ROOT%" (
    cd /d "%PROJECT_ROOT%"
    echo 📂 Project folder found: 123
) else (
    echo ❌ ERROR: Project folder not found at: %PROJECT_ROOT%
    pause
    exit /b 1
)

:: 2. Build Project
echo 🔨 Building web files (Vite build)...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build failed!
    pause
    exit /b 1
)

:: 3. Prepare Export Folder
if exist "%EXPORT_DIR%" (
    echo 🧹 Cleaning old files...
    rmdir /s /q "%EXPORT_DIR%"
)
mkdir "%EXPORT_DIR%"

:: 4. Copy Files
echo 📦 Copying files to Desktop...
xcopy /s /e /y ".\dist\*" "%EXPORT_DIR%\" > nul

echo.
echo ✅ PROCESS COMPLETED SUCCESSFULLY!
echo 📁 Updated project files are here:
echo %EXPORT_DIR%
echo.

:: Open folder
start "" "%EXPORT_DIR%"

pause

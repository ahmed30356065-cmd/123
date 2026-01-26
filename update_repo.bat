@echo off
echo ==========================================
echo      GOO NOW - Quick Repository Update
echo ==========================================

cd /d "%~dp0"

echo.
echo [1/3] Checking for changes...
git status

echo.
echo [2/3] Staging and Committing changes...
git add .
:: Check if there are changes to commit
git diff-index --quiet HEAD || git commit -m "Quick update: %date% %time%"

echo.
echo [3/3] Pushing to remote server...
git push

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed! 
    echo Please checking your internet connection or sign in if prompted.
) else (
    echo.
    echo [SUCCESS] Repository updated successfully!
)

echo.
pause

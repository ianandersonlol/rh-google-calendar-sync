@echo off
echo ========================================
echo Raid Helper Calendar Sync
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please run setup.bat first.
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run: npm install
    echo.
    pause
    exit /b 1
)

echo Starting sync...
echo.

call npm start

echo.
pause

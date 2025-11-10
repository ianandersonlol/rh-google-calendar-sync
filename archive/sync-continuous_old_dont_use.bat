@echo off
echo ========================================
echo Raid Helper Calendar Sync (Continuous)
echo ========================================
echo.

REM Check if config.env exists
if not exist "config.env" (
    echo ERROR: config.env file not found!
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

echo Starting continuous sync...
echo This will check for updates every 30 minutes.
echo Press Ctrl+C to stop.
echo.

call npm start -- --continuous

pause

@echo off
echo ========================================
echo Raid Helper Calendar Sync - DRY RUN
echo ========================================
echo.
echo This will show what changes WOULD be made
echo without actually making any changes.
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

echo Running dry-run sync...
echo.

call npm start -- --dry-run

echo.
echo ========================================
echo DRY RUN COMPLETE
echo ========================================
echo.
echo No actual changes were made to your calendar.
echo To apply these changes, run sync.bat instead.
echo.
pause

@echo off
echo ========================================
echo Raid Helper iCal Generator
echo ========================================
echo.
echo This creates a .ics file you can import into any calendar app.
echo NOTE: This does NOT auto-delete cancelled raids.
echo For full sync with deletions, use sync.bat instead.
echo.

REM Check if config.env exists
if not exist "config.env" (
    echo ERROR: config.env file not found!
    echo Please create it by copying config-example.env to config.env and filling in your API key.
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

echo Generating iCal file...
echo.

call npm start -- --ical

echo.
echo The file raid-helper-events.ics has been created.
echo You can import this into Google Calendar, Outlook, Apple Calendar, etc.
echo.
pause

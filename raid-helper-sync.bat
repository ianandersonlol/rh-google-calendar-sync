@echo off
setlocal enabledelayedexpansion

:MAIN_MENU
cls
echo ========================================
echo   Raid Helper Calendar Sync
echo ========================================
echo.
echo 1. Setup/Edit Configuration
echo 2. Generate iCal File (Simple Export)
echo 3. Full Sync with Google Calendar
echo 4. Install Dependencies
echo 5. Exit
echo.
set /p choice="Select an option (1-5): "

if "%choice%"=="1" goto SETUP
if "%choice%"=="2" goto ICAL
if "%choice%"=="3" goto FULL_SYNC
if "%choice%"=="4" goto INSTALL
if "%choice%"=="5" goto EXIT
echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MAIN_MENU

REM ========================================
REM Setup/Edit Configuration
REM ========================================
:SETUP
cls
echo ========================================
echo   Configuration Setup
echo ========================================
echo.

REM Check if config.env exists
if exist "config.env" (
    echo Configuration file found!
    echo.
    echo 1. Edit existing configuration
    echo 2. Create new configuration
    echo 3. Back to main menu
    echo.
    set /p setup_choice="Select an option (1-3): "

    if "!setup_choice!"=="3" goto MAIN_MENU
    if "!setup_choice!"=="2" (
        set /p confirm="Are you sure? This will overwrite your existing config. (y/n): "
        if /i not "!confirm!"=="y" goto MAIN_MENU
    )
) else (
    echo No configuration file found.
    echo Let's create one!
    echo.
    pause
)

echo.
echo To get your Raid Helper API key:
echo   1. Open Discord
echo   2. Go to a server with Raid Helper
echo   3. Type: /usersettings apikey
echo   4. Copy the API key shown
echo.
set /p api_key="Paste your Raid Helper API key here: "

if "%api_key%"=="" (
    echo ERROR: API key cannot be empty!
    pause
    goto SETUP
)

echo.
echo For simple iCal export, we only need the API key.
echo For full Google Calendar sync, you'll also need Google credentials.
echo.
echo Do you want to set up Google Calendar sync? (y/n)
set /p google_setup="(Press 'n' if you only want iCal export): "

if /i "!google_setup!"=="y" (
    echo.
    echo Recommended: Press Enter to use 'separate' (creates a dedicated calendar)
    echo.
    set /p calendar_id="Calendar ID (press Enter for 'separate'): "
    if "!calendar_id!"=="" set calendar_id=separate

    echo.
    set /p creds_path="Google credentials file path (press Enter for './credentials.json'): "
    if "!creds_path!"=="" set creds_path=./credentials.json

    set token_path=./token.json

    REM Create full config
    (
    echo # Raid Helper API Key
    echo RAID_HELPER_API_KEY=!api_key!
    echo.
    echo # Google Calendar ID
    echo GOOGLE_CALENDAR_ID=!calendar_id!
    echo.
    echo # Google Calendar credentials path
    echo GOOGLE_CREDENTIALS_PATH=!creds_path!
    echo.
    echo # Google Calendar token path
    echo GOOGLE_TOKEN_PATH=!token_path!
    ) > config.env
) else (
    REM Create minimal config for iCal only
    (
    echo # Raid Helper API Key
    echo RAID_HELPER_API_KEY=!api_key!
    ) > config.env
)

echo.
echo Configuration saved successfully!
echo.
pause
goto MAIN_MENU

REM ========================================
REM Generate iCal File
REM ========================================
:ICAL
cls
echo ========================================
echo   Generate iCal File
echo ========================================
echo.

REM Check if config.env exists
if not exist "config.env" (
    echo ERROR: config.env file not found!
    echo Please run Setup first (Option 1).
    echo.
    pause
    goto MAIN_MENU
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run Install Dependencies (Option 4) first.
    echo.
    pause
    goto MAIN_MENU
)

echo Generating iCal file...
echo.

call npm start -- --ical

echo.
echo The file raid-helper-events.ics has been created.
echo You can import this into Google Calendar, Outlook, Apple Calendar, etc.
echo.
echo To import into Google Calendar:
echo   1. Open Google Calendar
echo   2. Click the gear icon - Settings
echo   3. Click "Import & Export"
echo   4. Choose raid-helper-events.ics
echo.
pause
goto MAIN_MENU

REM ========================================
REM Full Sync with Google Calendar
REM ========================================
:FULL_SYNC
cls
echo ========================================
echo   Full Sync with Google Calendar
echo ========================================
echo.

REM Check if config.env exists
if not exist "config.env" (
    echo ERROR: config.env file not found!
    echo Please run Setup first (Option 1).
    echo.
    pause
    goto MAIN_MENU
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run Install Dependencies (Option 4) first.
    echo.
    pause
    goto MAIN_MENU
)

echo This will sync your Raid Helper events with Google Calendar.
echo.
echo The sync will:
echo   - Add new events to your calendar
echo   - Update changed events
echo   - Remove events that are no longer in Raid Helper
echo.
echo You will be asked to confirm before any changes are made.
echo.
pause

call npm start -- --confirm

echo.
pause
goto MAIN_MENU

REM ========================================
REM Install Dependencies
REM ========================================
:INSTALL
cls
echo ========================================
echo   Install Dependencies
echo ========================================
echo.

if exist "node_modules" (
    echo Dependencies appear to be already installed.
    set /p reinstall="Do you want to reinstall? (y/n): "
    if /i not "!reinstall!"=="y" goto MAIN_MENU
    echo.
)

echo Installing dependencies...
echo This may take a minute or two.
echo.

call npm install

echo.
if errorlevel 1 (
    echo Installation failed!
    echo Please check that Node.js is installed correctly.
) else (
    echo Installation complete!
)
echo.
pause
goto MAIN_MENU

REM ========================================
REM Exit
REM ========================================
:EXIT
echo.
echo Thanks for using Raid Helper Calendar Sync!
echo.
timeout /t 2 >nul
exit /b 0

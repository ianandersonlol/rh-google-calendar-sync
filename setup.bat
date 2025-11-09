@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Raid Helper Calendar Sync - Setup
echo ========================================
echo.

REM Check if .env already exists
if exist ".env" (
    echo WARNING: .env file already exists!
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "!overwrite!"=="y" (
        echo Setup cancelled.
        pause
        exit /b
    )
    echo.
)

echo This script will help you create your .env configuration file.
echo.
echo You'll need:
echo   1. Your Raid Helper API key (from /usersettings apikey in Discord)
echo   2. Your Google Calendar credentials (credentials.json file)
echo.
pause
echo.

REM Prompt for Raid Helper API key
echo ========================================
echo Step 1: Raid Helper API Key
echo ========================================
echo.
echo To get your API key:
echo   1. Open Discord
echo   2. Go to a server with Raid Helper
echo   3. Type: /usersettings apikey
echo   4. Click "Refresh API Key" if needed
echo   5. Copy the API key shown
echo.
set /p api_key="Paste your Raid Helper API key here: "
echo.

REM Prompt for Google Calendar ID
echo ========================================
echo Step 2: Google Calendar ID
echo ========================================
echo.
echo Recommended: Press Enter to use 'separate' (creates a dedicated calendar you can color!)
echo.
echo Options:
echo   'separate' - Create "Raid Helper Events" calendar with its own color (recommended)
echo   'primary'  - Use your main calendar
echo.
set /p calendar_id="Calendar ID (press Enter for 'separate'): "
if "!calendar_id!"=="" set calendar_id=separate
echo.

REM Prompt for credentials path
echo ========================================
echo Step 3: Google Credentials File
echo ========================================
echo.
echo You need to download OAuth credentials from Google Cloud Console.
echo See README.md for detailed instructions.
echo.
echo Default location: ./credentials.json
echo.
set /p creds_path="Credentials file path (press Enter for default): "
if "!creds_path!"=="" set creds_path=./credentials.json
echo.

REM Token path (usually default is fine)
set token_path=./token.json

REM Create .env file
echo ========================================
echo Creating .env file...
echo ========================================
echo.

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
) > .env

echo .env file created successfully!
echo.

REM Check if credentials.json exists
if not exist "credentials.json" (
    if "!creds_path!"=="./credentials.json" (
        echo WARNING: credentials.json not found!
        echo.
        echo Next steps:
        echo   1. Go to https://console.cloud.google.com/
        echo   2. Create a project and enable Google Calendar API
        echo   3. Create OAuth Desktop credentials
        echo   4. Download as credentials.json in this folder
        echo   5. Then run: npm install
        echo   6. Then run: npm start
        echo.
    )
) else (
    echo credentials.json found!
    echo.
    echo Next steps:
    echo   1. Run: npm install
    echo   2. Run: npm start
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    set /p install_now="Do you want to run 'npm install' now? (y/n): "
    if /i "!install_now!"=="y" (
        echo.
        echo Running npm install...
        call npm install
        echo.
        echo Setup complete! You can now run: npm start
    )
) else (
    echo Dependencies already installed.
    echo Setup complete! You can now run: npm start
)

echo.
pause

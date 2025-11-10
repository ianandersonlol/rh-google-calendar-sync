# Raid Helper to Google Calendar Sync

Sync your Raid Helper Discord events to Google Calendar automatically. Never miss a raid again.

## What This Does

This tool takes the raids you've signed up for in Discord (via Raid Helper bot) and adds them to your Google Calendar. By default, it only syncs raids within 10 days before/after today, so you won't get years of old events cluttering your calendar.

## Two Ways to Use This

### Option 1: Full Sync (Recommended)
- Automatically adds new raids to your calendar
- Updates raid details if they change
- Removes raids from your calendar if they're cancelled
- Setup time: 15-20 minutes
- Requires: Google Calendar API setup

### Option 2: Simple Export
- Creates a calendar file (.ics) you can import
- Much simpler setup (5 minutes)
- Cannot automatically remove cancelled raids
- Requires: Just your Raid Helper API key

**Choose Full Sync if:** You want everything automated and don't mind spending extra time on setup.

**Choose Simple Export if:** You want quick setup and don't mind occasionally cleaning up old events manually.

## Setup Instructions

Follow these steps in order. Don't skip any steps.

### Step 1: Install Node.js

Node.js is required to run this tool.

**Windows or Mac:**
1. Go to https://nodejs.org
2. Download the "LTS" version (the one marked "Recommended for most users")
3. Run the installer
4. Click "Next" through all the prompts (default settings are fine)
5. Restart your computer after installation

**To verify it worked:**
- Windows: Open Command Prompt (search for "cmd" in Start menu)
- Mac: Open Terminal (search for "Terminal" in Spotlight)
- Type: `node --version`
- You should see something like `v20.x.x`

### Step 2: Download This Project

1. Download the project files (if you got this as a .zip, extract it somewhere)
2. Remember where you saved it (e.g., your Desktop or Documents folder)

### Step 3: Install Dependencies

**Windows:**
1. Open the folder where you extracted the project
2. Hold Shift and right-click in the folder
3. Click "Open PowerShell window here" or "Open command window here"
4. Type: `npm install`
5. Press Enter and wait (takes 30 seconds to 1 minute)

**Mac:**
1. Open Terminal
2. Type `cd ` (with a space after cd)
3. Drag the project folder into the Terminal window
4. Press Enter
5. Type: `npm install`
6. Press Enter and wait

You should see a bunch of text scroll by. When it's done, you'll see a message about packages being added.

### Step 4: Get Your Raid Helper API Key

1. Open Discord
2. Go to any server that has the Raid Helper bot
3. Type this command: `/usersettings apikey`
4. Raid Helper will show a message with buttons
5. If you see a key already, copy it. If not, click "Refresh API Key" first
6. Copy the long string of letters and numbers (this is your API key)
7. Save it somewhere - you'll need it in the next step

**Important:** Keep this API key private. Don't share it with anyone.

---

## Configuration

At this point, choose which mode you want to use:

### Option A: Simple Export Mode (5 minutes)

**Skip the Google setup and just create calendar files**

1. In the project folder, find the file `config-example.env`
2. Make a copy of it and name the copy `config.env`
3. Open `config.env` with Notepad (Windows) or TextEdit (Mac)
4. Find the line that says `RAID_HELPER_API_KEY=your_raid_helper_api_key_here`
5. Replace `your_raid_helper_api_key_here` with the API key you copied from Discord
6. Save and close the file

**You're done! Skip to the "How to Use - Simple Export" section below.**

### Option B: Full Sync Mode (15-20 minutes)

**Get automatic sync with Google Calendar**

This requires a bit more setup, but it's worth it for automatic sync.

#### Part 1: Set Up Google Calendar API

1. Go to https://console.cloud.google.com/
2. Sign in with your Google account (the one you use for Google Calendar)
3. You'll see a page with a lot of options - don't panic

**Create a Project:**
1. At the top of the page, click "Select a project"
2. Click "New Project"
3. Name it "Raid Helper Sync" (or anything you want)
4. Click "Create"
5. Wait a few seconds for it to create

**Enable Google Calendar API:**
1. On the left sidebar, click "APIs & Services"
2. Click "Library"
3. In the search box, type "Google Calendar API"
4. Click on "Google Calendar API" from the results
5. Click the blue "Enable" button
6. Wait for it to enable (5-10 seconds)

**Create Credentials:**
1. On the left sidebar, click "Credentials"
2. At the top, click "Create Credentials"
3. Select "OAuth client ID"
4. If it asks you to configure consent screen:
   - Click "Configure Consent Screen"
   - Choose "External"
   - Click "Create"
   - App name: Type "Raid Helper Sync"
   - User support email: Choose your email
   - Developer contact: Type your email
   - Click "Save and Continue"
   - Click "Save and Continue" again (skip adding scopes)
   - Click "Add Users" and add your own email address
   - Click "Save and Continue"
   - Click "Back to Dashboard"
   - Go back to "Credentials" on the left sidebar
   - Click "Create Credentials" > "OAuth client ID" again

5. For Application type, choose "Desktop app"
6. Name it "Raid Helper Sync"
7. Click "Create"
8. A popup appears - click "Download JSON"
9. Save this file in your project folder
10. Rename it to `credentials.json` (exactly that name)

#### Part 2: Configure Settings

1. In the project folder, find `config-example.env`
2. Make a copy and name it `config.env`
3. Open `config.env` with Notepad or TextEdit
4. You'll see several lines - edit these:

```
RAID_HELPER_API_KEY=paste_your_api_key_here
GOOGLE_CALENDAR_ID=separate
GOOGLE_CREDENTIALS_PATH=./credentials.json
GOOGLE_TOKEN_PATH=./token.json
```

Replace `paste_your_api_key_here` with your actual Raid Helper API key.

Leave the other lines as they are.

5. Save and close the file

**You're done with setup!** Continue to "How to Use - Full Sync" below.

---

## How to Use

### How to Use - Simple Export

**This creates a calendar file you can import into any calendar app.**

**Windows Users:**
1. Double-click **generate-ical.bat** in the project folder
2. Wait for it to finish (you'll see messages about events being found)
3. When it's done, you'll see a file called `raid-helper-events.ics` in the folder
4. Continue to "Importing into Google Calendar" below

**Mac/Linux Users:**
1. Open Terminal
2. Navigate to the project folder (use `cd` like in Step 3 of setup)
3. Type: `npm start -- --ical`
4. Press Enter
5. Wait for it to finish
6. Continue to "Importing into Google Calendar" below

**Importing into Google Calendar:**
1. Open Google Calendar in your web browser
2. Click the gear icon in the top right
3. Click "Settings"
4. On the left side, click "Import & Export"
5. Click "Select file from your computer"
6. Choose the `raid-helper-events.ics` file
7. Click "Import"
8. Your raids will appear in your calendar

**To get new raids:**
- Run the tool again (double-click generate-ical.bat or run the command)
- Import the new .ics file
- Only new/updated raids will be added (no duplicates!)

**Note:** This mode cannot automatically remove cancelled raids. You'll need to manually delete those from your calendar.

### How to Use - Full Sync

**This automatically syncs everything with Google Calendar.**

**First Time Only - Authorize with Google:**

The first time you run it, you need to give the tool permission to access your calendar.

1. Run the sync:
   - Windows: Double-click **sync.bat**
   - Mac/Linux: In Terminal, run `npm start`

2. You'll see a message like "Authorize this app by visiting this url:"
3. Copy the URL and paste it into your web browser
4. Sign in to Google (use the same account you used for the API setup)
5. You'll see a warning that says "Google hasn't verified this app"
   - This is normal! You created the app yourself
   - Click "Advanced"
   - Click "Go to Raid Helper Sync (unsafe)"
   - Click "Continue"
6. Google will show you a code
7. Copy the code
8. Go back to your Command Prompt/Terminal window
9. Paste the code where it says "Enter the code from that page here:"
10. Press Enter

The tool will now sync your raids. This authorization step only happens once.

**After First Time - Regular Use:**

**Windows Users:**
- One-time sync: Double-click **sync.bat**
- Test first (dry run): Double-click **sync-dry-run.bat**
- Continuous sync: Double-click **sync-continuous.bat** (runs every 30 minutes)

**Mac/Linux Users:**
- One-time sync: `npm start`
- Test first (dry run): `npm start -- --dry-run`
- Continuous sync: `npm start -- --continuous`

**What Happens During Sync:**
- New raids you signed up for appear in your calendar
- Raid details get updated if they change
- Cancelled raids get removed from your calendar
- Only raids within 10 days before/after today are synced (prevents old events cluttering your calendar)

**To sync all raids (not just recent ones):**
```
npm start -- --all-time
```

---

## Additional Features

### Customizing Calendar Color (Full Sync Only)

If you used the recommended setup (`GOOGLE_CALENDAR_ID=separate`), the tool creates a separate "Raid Helper Events" calendar. You can give it its own color to make raids easy to spot:

1. Open Google Calendar in your web browser
2. Look at the left sidebar under "My calendars"
3. Find "Raid Helper Events"
4. Hover over it and click the three dots
5. Pick a color

Now all your raids will show in that color, separate from your other calendar events.

### Adjusting Time Window

By default, only raids within 10 days before/after today are synced. To change this:

**Sync raids within 30 days instead:**
```
npm start -- --time-window 30
```

**Sync ALL raids (including old ones):**
```
npm start -- --all-time
```

This works for both Full Sync and Simple Export modes.

---

## Troubleshooting

### Error: "Missing required environment variables"

**Problem:** Your `config.env` file isn't set up correctly.

**Solution:**
1. Make sure you created a `config.env` file (not `config-example.env`)
2. Open it and verify you pasted your Raid Helper API key
3. Make sure there are no extra spaces around the = sign

### Error: "Raid Helper API error: 401"

**Problem:** Your Raid Helper API key is wrong or expired.

**Solution:**
1. Go to Discord
2. Type `/usersettings apikey` again
3. Click "Refresh API Key"
4. Copy the new key
5. Update your `config.env` file with the new key

### Error: "Error reading credentials.json"

**Problem:** The Google credentials file is missing or in the wrong place.

**Solution:**
1. Make sure you downloaded the JSON file from Google Cloud Console
2. Make sure it's named exactly `credentials.json` (not `credentials.json.txt`)
3. Make sure it's in the same folder as the other project files

### No events are showing up

**Possible causes:**
- The events are more than 10 days away (use `--all-time` flag)
- You haven't actually signed up for any raids in Discord
- Your Raid Helper API key is wrong

**To check:**
Run in dry-run mode to see what would be synced:
```
npm start -- --dry-run
```

### I see duplicate events

**For Full Sync mode:** This shouldn't happen. If it does, delete the duplicate events manually. The tool tracks events to prevent duplicates.

**For Simple Export mode:** This can happen if you import the same .ics file twice. The cache system should prevent it, but if you see duplicates:
1. Delete the `ical-cache.json` file
2. Delete all Raid Helper events from your calendar manually
3. Run the export again and import fresh

### "Google hasn't verified this app" warning

This is normal! You created the app yourself, so Google doesn't know about it. Just click "Advanced" then "Go to Raid Helper Sync (unsafe)" to continue.

---

## Important Security Information

- Keep your `config.env` file private (never share it or upload it online)
- Keep your `credentials.json` file private
- If you accidentally share your Raid Helper API key, refresh it immediately in Discord with `/usersettings apikey`
- The `token.json` file that gets created contains access to your Google Calendar - keep it private too

---

## Questions or Problems?

If you run into issues not covered here:
1. Double-check you followed all setup steps in order
2. Make sure Node.js is installed correctly
3. Try running in dry-run mode to see what the tool would do
4. Check that your API keys are correct

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

## Quick Start (Windows)

**The easiest way to get started:**

1. **Install Node.js** (one-time setup)
   - Go to https://nodejs.org
   - Download the "LTS" version
   - Run the installer and click through it
   - Restart your computer

2. **Get this project**
   - **Option A:** Download the .zip file and extract it to a folder (e.g., Desktop)
   - **Option B:** Clone with git: `git clone https://github.com/ianandersonlol/rh-google-calendar-sync.git`

3. **Run the tool**
   - Double-click `raid-helper-sync.bat`
   - Choose "Install Dependencies" (first time only)
   - Choose "Setup/Edit Configuration" and follow the prompts
   - You're ready to go!

That's it! The batch file menu will guide you through everything else.

---

## Detailed Setup

### Step 1: Install Node.js

1. Go to https://nodejs.org
2. Download the "LTS" version (the one marked "Recommended for most users")
3. Run the installer with default settings
4. Restart your computer after installation

### Step 2: Get This Project

**Option A - Download:**
1. Download the .zip file from GitHub
2. Extract it to a folder (e.g., Desktop or Documents)

**Option B - Clone with Git:**
```bash
git clone https://github.com/ianandersonlol/rh-google-calendar-sync.git
```

### Step 3: Get Your Raid Helper API Key

1. Open Discord
2. Go to any server that has the Raid Helper bot
3. Type: `/usersettings apikey`
4. Copy the API key shown (or click "Refresh API Key" first if needed)
5. Keep this private - you'll need it for configuration

### Step 4: Choose Your Mode

You can use the tool in two ways:

**Simple Export Mode (5 minutes setup):**
- Creates a calendar file (.ics) you can import
- Only need your Raid Helper API key
- Cannot automatically remove cancelled raids

**Full Sync Mode (15-20 minutes setup):**
- Automatically adds, updates, and removes events
- Requires Google Calendar API setup (see below)
- Shows you changes before applying them

---

## Google Calendar API Setup (Full Sync Mode Only)

Skip this if you're using Simple Export mode. The batch file will guide you through configuration after you complete this.

### Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Click "Select a project" at the top → "New Project"
4. Name it "Raid Helper Sync" and click "Create"

### Enable Google Calendar API

1. In the left sidebar, click "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

### Create OAuth Credentials

1. Left sidebar → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted to configure consent screen:
   - Choose "External" → "Create"
   - App name: "Raid Helper Sync"
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue" through the remaining screens
   - Add your email under "Test users"
   - Go back to Credentials

4. Click "Create Credentials" → "OAuth client ID" again
5. Application type: "Desktop app"
6. Name: "Raid Helper Sync"
7. Click "Create"
8. Click "Download JSON"
9. Save as `credentials.json` in your project folder

**You're done!** Now run `raid-helper-sync.bat` and use the setup menu to configure your API keys.

---

## How to Use

### Windows Users - Use the Menu

**Double-click `raid-helper-sync.bat`** and choose an option:

1. **Setup/Edit Configuration** - First time setup or change settings
2. **Generate iCal File** - Create .ics file to import manually
3. **Full Sync with Google Calendar** - Automatic sync (shows changes before applying)
4. **Install Dependencies** - Run this first time only

The menu handles everything!

### Importing iCal Files (Option 2)

After generating an .ics file:

1. Open Google Calendar in your browser
2. Click gear icon → Settings → Import & Export
3. Choose `raid-helper-events.ics`
4. Click Import

**Note:** If you later switch to Full Sync (Option 3), it will recognize your imported events and won't create duplicates!

### First-Time Google Authorization (Option 3)

When you first run Full Sync, you'll need to authorize the app:

1. A URL will appear - copy it and open in your browser
2. Sign in to Google
3. You'll see "Google hasn't verified this app" - this is normal!
   - Click "Advanced" → "Go to Raid Helper Sync (unsafe)" → "Continue"
4. Copy the code shown and paste it back in the command window
5. Done! This only happens once.

### Advanced Users - Command Line

**Simple Export:**
```bash
npm start -- --ical
```

**Full Sync:**
```bash
npm start -- --confirm
```

**Options:**
```bash
# Sync all events (not just 10 days before/after)
npm start -- --confirm --all-time

# Change time window
npm start -- --confirm --time-window 30
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

### Switching from iCal to Full Sync

If you start with iCal exports and later want to switch to full sync:

1. Set up your Google Calendar credentials in `config.env`
2. Run the full sync
3. The tool will automatically recognize your imported events and won't create duplicates!

This works because both modes use the same event IDs internally.

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

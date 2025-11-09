import dotenv from 'dotenv';
import { EventSync } from './sync.js';
import { ICalGenerator } from './ical.js';

// Load environment variables
dotenv.config();

async function main() {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const icalMode = args.includes('--ical');
  const allTime = args.includes('--all-time');

  // Parse time window (default 10 days)
  const timeWindowIndex = args.findIndex(arg => arg === '--time-window');
  const timeWindowDays = timeWindowIndex !== -1 && args[timeWindowIndex + 1]
    ? parseInt(args[timeWindowIndex + 1])
    : 10;

  // iCal mode - simpler setup, no Google credentials needed
  if (icalMode) {
    if (!process.env.RAID_HELPER_API_KEY) {
      console.error('Error: RAID_HELPER_API_KEY is required');
      console.error('Please set it in your .env file');
      process.exit(1);
    }

    const icalGen = new ICalGenerator(process.env.RAID_HELPER_API_KEY, timeWindowDays);

    try {
      const continuousMode = args.includes('--continuous') || args.includes('-c');

      // Find output path
      const outputIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
      const outputPath = outputIndex !== -1 && args[outputIndex + 1]
        ? args[outputIndex + 1]
        : './raid-helper-events.ics';

      if (continuousMode) {
        // Find interval argument if provided
        const intervalIndex = args.findIndex(arg => arg === '--interval' || arg === '-i');
        const interval = intervalIndex !== -1 && args[intervalIndex + 1]
          ? parseInt(args[intervalIndex + 1])
          : 30;

        await icalGen.watchAndGenerate(outputPath, interval);
      } else {
        // Generate once
        await icalGen.generateICalFile(outputPath, allTime);
        console.log('\nTo import into Google Calendar:');
        console.log('1. Open Google Calendar');
        console.log('2. Click the gear icon → Settings');
        console.log('3. Click "Import & Export"');
        console.log('4. Click "Select file from your computer"');
        console.log(`5. Choose: ${outputPath}`);
        console.log('\nNote: Only new/updated events are exported to prevent duplicates.');
        console.log('Re-import this file to add new events. Old events stay in your calendar.');
      }
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
    return;
  }

  // Full sync mode - requires Google Calendar credentials
  const requiredEnvVars = [
    'RAID_HELPER_API_KEY',
    'GOOGLE_CALENDAR_ID',
    'GOOGLE_CREDENTIALS_PATH',
    'GOOGLE_TOKEN_PATH'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Error: Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease create a .env file based on .env.example');
    console.error('\nOr use --ical mode for simpler setup (no Google credentials needed):');
    console.error('  npm start -- --ical');
    process.exit(1);
  }

  // Check for dry-run mode
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  // Create sync instance
  const sync = new EventSync(
    process.env.RAID_HELPER_API_KEY,
    process.env.GOOGLE_CREDENTIALS_PATH,
    process.env.GOOGLE_TOKEN_PATH,
    process.env.GOOGLE_CALENDAR_ID,
    false, // useSeparateCalendar - determined automatically from calendarId
    dryRun,
    timeWindowDays,
    allTime
  );

  try {
    // Initialize (authenticate with Google)
    await sync.initialize();

    const continuousMode = args.includes('--continuous') || args.includes('-c');

    if (continuousMode) {
      if (dryRun) {
        console.log('NOTE: Continuous mode with --dry-run will show what changes would be made repeatedly.');
        console.log('No actual changes will be made.\n');
      }

      // Find interval argument if provided
      const intervalIndex = args.findIndex(arg => arg === '--interval' || arg === '-i');
      const interval = intervalIndex !== -1 && args[intervalIndex + 1]
        ? parseInt(args[intervalIndex + 1])
        : 30;

      await sync.startContinuousSync(interval);
    } else {
      // Run single sync
      await sync.syncEvents();
      if (!dryRun) {
        console.log('Sync completed. Run with --continuous flag for continuous syncing.');
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Run the main function
main();

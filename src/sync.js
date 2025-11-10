import { RaidHelperClient } from './raidHelper.js';
import { GoogleCalendarClient } from './googleCalendar.js';
import readline from 'readline';

export class EventSync {
  constructor(raidHelperApiKey, googleCredentialsPath, googleTokenPath, calendarId, useSeparateCalendar = false, dryRun = false, timeWindowDays = 10, allTime = false, requireConfirmation = false) {
    this.raidHelper = new RaidHelperClient(raidHelperApiKey, timeWindowDays);
    this.googleCalendar = new GoogleCalendarClient(googleCredentialsPath, googleTokenPath);
    this.calendarId = calendarId;
    this.useSeparateCalendar = useSeparateCalendar;
    this.dryRun = dryRun;
    this.allTime = allTime;
    this.requireConfirmation = requireConfirmation;
  }

  /**
   * Ask user for confirmation
   * @param {string} message - Question to ask
   * @returns {Promise<boolean>} True if user confirms
   */
  async askConfirmation(message) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${message} (y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Initialize the sync service
   */
  async initialize() {
    console.log('Initializing sync service...');
    await this.googleCalendar.authenticate();
    console.log('Google Calendar authenticated successfully');

    // SECURITY: Always use a separate dedicated calendar
    // This ensures we never touch the user's primary calendar or other calendars
    if (this.calendarId === 'primary') {
      console.warn('\nWARNING: Using primary calendar is not recommended for security reasons.');
      console.warn('The app will create a dedicated "Raid Helper Events" calendar instead.\n');
      this.calendarId = 'separate';
    }

    // Create or find the dedicated Raid Helper calendar
    if (this.useSeparateCalendar || this.calendarId === 'separate' || !this.calendarId) {
      this.calendarId = await this.googleCalendar.getOrCreateRaidHelperCalendar();
      console.log('Using dedicated "Raid Helper Events" calendar for security');
    }
  }

  /**
   * Sync events from Raid Helper to Google Calendar
   */
  async syncEvents() {
    if (this.dryRun) {
      console.log('\n=== DRY RUN MODE - No changes will be made ===');
    }
    console.log('\n=== Starting Sync ===');
    console.log('Fetching events from Raid Helper...');

    try {
      // Fetch events from Raid Helper
      const raidHelperEvents = await this.raidHelper.getEvents(this.allTime);
      console.log(`Found ${raidHelperEvents.length} events from Raid Helper`);

      // Fetch existing synced events from Google Calendar
      const calendarEvents = await this.googleCalendar.getSyncedEvents(this.calendarId);
      console.log(`Found ${calendarEvents.length} synced events in Google Calendar`);

      // Create maps for quick lookup
      const raidHelperMap = new Map();
      for (const event of raidHelperEvents) {
        raidHelperMap.set(event.id.toString(), event);
      }

      const calendarMap = new Map();
      for (const event of calendarEvents) {
        // Try to get Raid Helper ID from private property first
        let raidHelperId = event.extendedProperties?.private?.raidHelperId;

        // If not found, try to extract from iCal UID (for imported events)
        if (!raidHelperId && event.iCalUID && event.iCalUID.startsWith('raid-helper-')) {
          // Extract ID from UID format: raid-helper-{ID}@raid-helper.dev
          const match = event.iCalUID.match(/^raid-helper-(\d+)@raid-helper\.dev$/);
          if (match) {
            raidHelperId = match[1];
          }
        }

        if (raidHelperId) {
          calendarMap.set(raidHelperId, event);
        }
      }

      // Collect planned changes
      const toCreate = [];
      const toUpdate = [];
      const toDelete = [];

      // Process Raid Helper events
      for (const [raidHelperId, raidHelperEvent] of raidHelperMap) {
        const formattedEvent = this.raidHelper.formatEventForCalendar(raidHelperEvent);
        const existingCalendarEvent = calendarMap.get(raidHelperId);

        if (existingCalendarEvent) {
          // Event exists - check if it needs updating
          if (this.shouldUpdateEvent(existingCalendarEvent, formattedEvent)) {
            toUpdate.push({ existing: existingCalendarEvent, formatted: formattedEvent });
          }
          // Remove from calendar map so we know it's been processed
          calendarMap.delete(raidHelperId);
        } else {
          // New event - create it
          toCreate.push(formattedEvent);
        }
      }

      // Any events left in calendarMap are no longer in Raid Helper - delete them
      for (const [raidHelperId, calendarEvent] of calendarMap) {
        toDelete.push({ raidHelperId, event: calendarEvent });
      }

      // Show planned changes
      console.log('\n--- Planned Changes ---\n');

      if (toCreate.length > 0) {
        console.log(`Will CREATE ${toCreate.length} new event(s):`);
        toCreate.forEach(event => {
          console.log(`  + ${event.title}`);
          console.log(`    Start: ${event.startTime}`);
        });
        console.log();
      }

      if (toUpdate.length > 0) {
        console.log(`Will UPDATE ${toUpdate.length} event(s):`);
        toUpdate.forEach(({ formatted }) => {
          console.log(`  ~ ${formatted.title}`);
          console.log(`    Start: ${formatted.startTime}`);
        });
        console.log();
      }

      if (toDelete.length > 0) {
        console.log(`Will DELETE ${toDelete.length} event(s):`);
        toDelete.forEach(({ event }) => {
          console.log(`  - ${event.summary}`);
          console.log(`    (No longer in Raid Helper)`);
        });
        console.log();
      }

      if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
        console.log('No changes needed - everything is already in sync!');
        return { created: 0, updated: 0, deleted: 0 };
      }

      // Ask for confirmation if required and not in dry-run mode
      if (!this.dryRun && this.requireConfirmation) {
        const confirmed = await this.askConfirmation('\nProceed with these changes?');
        if (!confirmed) {
          console.log('\nSync cancelled by user.');
          return { created: 0, updated: 0, deleted: 0 };
        }
        console.log();
      }

      // Apply changes (unless dry-run)
      if (!this.dryRun) {
        console.log('Applying changes...\n');

        for (const event of toCreate) {
          await this.googleCalendar.createEvent(this.calendarId, event);
        }

        for (const { existing, formatted } of toUpdate) {
          await this.googleCalendar.updateEvent(this.calendarId, existing.id, formatted);
        }

        for (const { raidHelperId, event } of toDelete) {
          console.log(`Removing event: ${event.summary}`);
          await this.googleCalendar.deleteEvent(this.calendarId, event.id);
        }
      }

      console.log('\n=== Sync Complete ===');
      if (this.dryRun) {
        console.log('DRY RUN - No actual changes were made');
      }
      console.log(`Created: ${toCreate.length} events`);
      console.log(`Updated: ${toUpdate.length} events`);
      console.log(`Deleted: ${toDelete.length} events`);
      console.log('====================\n');

      return { created: toCreate.length, updated: toUpdate.length, deleted: toDelete.length };
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    }
  }

  /**
   * Check if a calendar event needs to be updated
   * @param {Object} calendarEvent - Existing Google Calendar event
   * @param {Object} formattedEvent - Formatted Raid Helper event
   * @returns {boolean} True if event needs updating
   */
  shouldUpdateEvent(calendarEvent, formattedEvent) {
    // Compare key fields to see if anything changed
    const titleChanged = calendarEvent.summary !== formattedEvent.title;
    const descriptionChanged = calendarEvent.description !== formattedEvent.description;

    const calendarStart = calendarEvent.start?.dateTime || calendarEvent.start?.date;
    const calendarEnd = calendarEvent.end?.dateTime || calendarEvent.end?.date;

    const startChanged = calendarStart !== formattedEvent.startTime;
    const endChanged = calendarEnd !== formattedEvent.endTime;

    return titleChanged || descriptionChanged || startChanged || endChanged;
  }

  /**
   * Run a continuous sync with specified interval
   * @param {number} intervalMinutes - How often to sync (in minutes)
   */
  async startContinuousSync(intervalMinutes = 30) {
    console.log(`Starting continuous sync (every ${intervalMinutes} minutes)...`);

    // Run initial sync
    await this.syncEvents();

    // Schedule recurring syncs
    setInterval(async () => {
      try {
        await this.syncEvents();
      } catch (error) {
        console.error('Error during scheduled sync:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log('Continuous sync running. Press Ctrl+C to stop.');
  }
}

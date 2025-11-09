import { RaidHelperClient } from './raidHelper.js';
import { GoogleCalendarClient } from './googleCalendar.js';

export class EventSync {
  constructor(raidHelperApiKey, googleCredentialsPath, googleTokenPath, calendarId, useSeparateCalendar = false, dryRun = false, timeWindowDays = 10, allTime = false) {
    this.raidHelper = new RaidHelperClient(raidHelperApiKey, timeWindowDays);
    this.googleCalendar = new GoogleCalendarClient(googleCredentialsPath, googleTokenPath);
    this.calendarId = calendarId;
    this.useSeparateCalendar = useSeparateCalendar;
    this.dryRun = dryRun;
    this.allTime = allTime;
  }

  /**
   * Initialize the sync service
   */
  async initialize() {
    console.log('Initializing sync service...');
    await this.googleCalendar.authenticate();
    console.log('Google Calendar authenticated successfully');

    // If using separate calendar, create or find it
    if (this.useSeparateCalendar || this.calendarId === 'separate') {
      this.calendarId = await this.googleCalendar.getOrCreateRaidHelperCalendar();
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
        const raidHelperId = event.extendedProperties?.private?.raidHelperId;
        if (raidHelperId) {
          calendarMap.set(raidHelperId, event);
        }
      }

      let created = 0;
      let updated = 0;
      let deleted = 0;

      console.log('\n--- Planned Changes ---\n');

      // Process Raid Helper events
      for (const [raidHelperId, raidHelperEvent] of raidHelperMap) {
        const formattedEvent = this.raidHelper.formatEventForCalendar(raidHelperEvent);
        const existingCalendarEvent = calendarMap.get(raidHelperId);

        if (existingCalendarEvent) {
          // Event exists - check if it needs updating
          if (this.shouldUpdateEvent(existingCalendarEvent, formattedEvent)) {
            if (this.dryRun) {
              console.log(`[UPDATE] ${formattedEvent.title}`);
              console.log(`  Start: ${formattedEvent.startTime}`);
              console.log(`  Changes detected (title, time, or description changed)`);
            } else {
              await this.googleCalendar.updateEvent(
                this.calendarId,
                existingCalendarEvent.id,
                formattedEvent
              );
            }
            updated++;
          }
          // Remove from calendar map so we know it's been processed
          calendarMap.delete(raidHelperId);
        } else {
          // New event - create it
          if (this.dryRun) {
            console.log(`[CREATE] ${formattedEvent.title}`);
            console.log(`  Start: ${formattedEvent.startTime}`);
            console.log(`  End: ${formattedEvent.endTime}`);
            console.log(`  Location: ${formattedEvent.location || 'N/A'}`);
          } else {
            await this.googleCalendar.createEvent(this.calendarId, formattedEvent);
          }
          created++;
        }
      }

      // Any events left in calendarMap are no longer in Raid Helper - delete them
      for (const [raidHelperId, calendarEvent] of calendarMap) {
        if (this.dryRun) {
          console.log(`[DELETE] ${calendarEvent.summary}`);
          console.log(`  Reason: Event ${raidHelperId} no longer exists in Raid Helper`);
          console.log(`  Start was: ${calendarEvent.start?.dateTime || calendarEvent.start?.date}`);
        } else {
          console.log(`Event ${raidHelperId} no longer exists in Raid Helper - removing from calendar`);
          await this.googleCalendar.deleteEvent(this.calendarId, calendarEvent.id);
        }
        deleted++;
      }

      console.log('\n=== Sync Complete ===');
      if (this.dryRun) {
        console.log('DRY RUN - No actual changes were made');
      }
      console.log(`Created: ${created} events`);
      console.log(`Updated: ${updated} events`);
      console.log(`Deleted: ${deleted} events`);
      console.log('====================\n');

      if (this.dryRun && (created > 0 || updated > 0 || deleted > 0)) {
        console.log('To apply these changes, run without --dry-run flag');
      }

      return { created, updated, deleted };
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

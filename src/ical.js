import fs from 'fs/promises';
import { RaidHelperClient } from './raidHelper.js';

export class ICalGenerator {
  constructor(raidHelperApiKey, timeWindowDays = 10) {
    this.raidHelper = new RaidHelperClient(raidHelperApiKey, timeWindowDays);
    this.cachePath = './ical-cache.json';
  }

  /**
   * Load the cache of previously exported events
   */
  async loadCache() {
    try {
      const cacheData = await fs.readFile(this.cachePath, 'utf-8');
      return JSON.parse(cacheData);
    } catch (error) {
      // Cache doesn't exist yet
      return {};
    }
  }

  /**
   * Save the cache of exported events
   */
  async saveCache(cache) {
    await fs.writeFile(this.cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  }

  /**
   * Generate an iCal file from Raid Helper events
   * @param {string} outputPath - Path to save the .ics file
   * @param {boolean} allTime - If true, fetch all events regardless of date
   */
  async generateICalFile(outputPath = './raid-helper-events.ics', allTime = false) {
    console.log('Fetching events from Raid Helper...');

    const events = await this.raidHelper.getEvents(allTime);
    console.log(`Found ${events.length} events`);

    // Load cache to check for duplicates
    const cache = await this.loadCache();
    const newCache = {};

    let newEvents = 0;
    let updatedEvents = 0;
    let skippedEvents = 0;

    const eventsToExport = [];

    for (const event of events) {
      const eventId = event.id.toString();
      const cached = cache[eventId];

      if (!cached) {
        // New event, never exported before
        eventsToExport.push(event);
        newEvents++;
      } else if (event.lastUpdated && event.lastUpdated > cached.lastUpdated) {
        // Event was updated since last export
        eventsToExport.push(event);
        updatedEvents++;
      } else {
        // Event unchanged, skip it
        skippedEvents++;
      }

      // Update cache entry
      newCache[eventId] = {
        lastExported: Math.floor(Date.now() / 1000),
        lastUpdated: event.lastUpdated || 0,
        title: event.title
      };
    }

    console.log(`\nNew events: ${newEvents}`);
    console.log(`Updated events: ${updatedEvents}`);
    console.log(`Unchanged (skipped): ${skippedEvents}`);

    const icalContent = this.createICalContent(eventsToExport);

    await fs.writeFile(outputPath, icalContent, 'utf-8');
    await this.saveCache(newCache);

    console.log(`\niCal file created: ${outputPath}`);
    console.log(`Exporting ${eventsToExport.length} events (${newEvents} new, ${updatedEvents} updated)`);
    console.log('\nIMPORTANT: Only new/updated events are included to prevent duplicates.');
    console.log('If you want to re-export everything, delete ical-cache.json');
    console.log('\nFor automatic deletion of cancelled raids, use the full Google Calendar sync.');

    return outputPath;
  }

  /**
   * Create iCal formatted content from events
   * @param {Array} events - Array of Raid Helper events
   * @returns {string} iCal formatted string
   */
  createICalContent(events) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Raid Helper Calendar Sync//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Raid Helper Events',
      'X-WR-TIMEZONE:UTC',
    ];

    for (const event of events) {
      const formattedEvent = this.raidHelper.formatEventForCalendar(event);
      ical.push(...this.createICalEvent(formattedEvent, timestamp));
    }

    ical.push('END:VCALENDAR');

    return ical.join('\r\n');
  }

  /**
   * Create an iCal event block
   * @param {Object} event - Formatted event data
   * @param {string} timestamp - Current timestamp
   * @returns {Array} Array of iCal lines for this event
   */
  createICalEvent(event, timestamp) {
    // Format dates to iCal format (YYYYMMDDTHHMMSSZ)
    const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Escape special characters in text fields
    const summary = this.escapeICalText(event.title);
    const description = this.escapeICalText(event.description);
    const location = this.escapeICalText(event.location);

    return [
      'BEGIN:VEVENT',
      `UID:raid-helper-${event.id}@raid-helper.dev`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      location ? `LOCATION:${location}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ].filter(line => line); // Remove empty lines
  }

  /**
   * Escape special characters for iCal format
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeICalText(text) {
    if (!text) return '';

    return text
      .replace(/\\/g, '\\\\')   // Escape backslashes
      .replace(/;/g, '\\;')      // Escape semicolons
      .replace(/,/g, '\\,')      // Escape commas
      .replace(/\n/g, '\\n');    // Escape newlines
  }

  /**
   * Generate and watch for changes (regenerate periodically)
   * @param {string} outputPath - Path to save the .ics file
   * @param {number} intervalMinutes - How often to regenerate
   */
  async watchAndGenerate(outputPath, intervalMinutes = 30) {
    console.log(`Generating iCal file every ${intervalMinutes} minutes...`);
    console.log('Note: You will need to re-import the file each time to see updates.\n');

    // Initial generation
    await this.generateICalFile(outputPath);

    // Schedule periodic regeneration
    setInterval(async () => {
      try {
        await this.generateICalFile(outputPath);
      } catch (error) {
        console.error('Error regenerating iCal file:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log('\nContinuously generating. Press Ctrl+C to stop.');
  }
}

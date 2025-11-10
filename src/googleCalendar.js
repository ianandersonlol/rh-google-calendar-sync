import { google } from 'googleapis';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';

export class GoogleCalendarClient {
  constructor(credentialsPath, tokenPath) {
    this.credentialsPath = credentialsPath;
    this.tokenPath = tokenPath;
    this.auth = null;
    this.calendar = null;
    this.raidHelperCalendarId = null; // Track the dedicated calendar ID
  }

  /**
   * Validate that we're only accessing the Raid Helper calendar
   * @param {string} calendarId - Calendar ID to validate
   */
  validateCalendarAccess(calendarId) {
    if (this.raidHelperCalendarId && calendarId !== this.raidHelperCalendarId) {
      throw new Error(`SECURITY: Attempted to access calendar ${calendarId} but only ${this.raidHelperCalendarId} is allowed`);
    }
  }

  /**
   * Initialize OAuth2 client and authenticate
   */
  async authenticate() {
    const credentials = JSON.parse(await fs.readFile(this.credentialsPath, 'utf-8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have a token saved
    try {
      const token = JSON.parse(await fs.readFile(this.tokenPath, 'utf-8'));
      this.auth.setCredentials(token);
    } catch (error) {
      // No token found, need to authenticate
      await this.getNewToken();
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Get new OAuth2 token through user consent
   */
  async getNewToken() {
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise((resolve) => {
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        resolve(code);
      });
    });

    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);

    // Save token for future use
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens));
    console.log('Token stored to', this.tokenPath);
  }

  /**
   * Create or find the Raid Helper calendar
   * @returns {Promise<string>} Calendar ID
   */
  async getOrCreateRaidHelperCalendar() {
    try {
      // List all calendars
      const calendarList = await this.calendar.calendarList.list();

      // Look for existing Raid Helper calendar
      const existingCalendar = calendarList.data.items.find(
        cal => cal.summary === 'Raid Helper Events'
      );

      if (existingCalendar) {
        console.log('Using existing Raid Helper Events calendar');
        this.raidHelperCalendarId = existingCalendar.id;
        return existingCalendar.id;
      }

      // Create new calendar
      console.log('Creating new Raid Helper Events calendar...');
      const calendar = await this.calendar.calendars.insert({
        requestBody: {
          summary: 'Raid Helper Events',
          description: 'Events synced from Raid Helper Discord bot - This app only has access to this calendar',
          timeZone: 'UTC',
        },
      });

      console.log('Raid Helper Events calendar created!');
      console.log('You can now set a custom color for it in Google Calendar.');
      console.log('SECURITY: This app only accesses this dedicated calendar, not your other calendars.');

      this.raidHelperCalendarId = calendar.data.id;
      return calendar.data.id;
    } catch (error) {
      console.error('Error creating/finding calendar:', error.message);
      throw error;
    }
  }

  /**
   * Get all events from calendar with specific prefix in description
   * @param {string} calendarId - Calendar ID
   * @returns {Promise<Array>} Array of calendar events
   */
  async getCalendarEvents(calendarId) {
    this.validateCalendarAccess(calendarId);
    try {
      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error.message);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   * @param {string} calendarId - Calendar ID
   * @param {Object} eventData - Event data formatted for Google Calendar
   * @returns {Promise<Object>} Created event
   */
  async createEvent(calendarId, eventData) {
    this.validateCalendarAccess(calendarId);
    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'UTC',
        },
        // Store Raid Helper event ID in extended properties for mapping
        extendedProperties: {
          private: {
            raidHelperId: eventData.id
          }
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });

      console.log(`Created event: ${eventData.title}`);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   * @param {string} calendarId - Calendar ID
   * @param {string} eventId - Google Calendar event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(calendarId, eventId, eventData) {
    this.validateCalendarAccess(calendarId);
    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'UTC',
        },
        extendedProperties: {
          private: {
            raidHelperId: eventData.id
          }
        }
      };

      const response = await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: event,
      });

      console.log(`Updated event: ${eventData.title}`);
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error.message);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   * @param {string} calendarId - Calendar ID
   * @param {string} eventId - Google Calendar event ID
   */
  async deleteEvent(calendarId, eventId) {
    this.validateCalendarAccess(calendarId);
    try {
      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });

      console.log(`Deleted event: ${eventId}`);
    } catch (error) {
      console.error('Error deleting event:', error.message);
      throw error;
    }
  }

  /**
   * Find calendar events that were synced from Raid Helper
   * @param {string} calendarId - Calendar ID
   * @returns {Promise<Array>} Array of synced calendar events
   */
  async getSyncedEvents(calendarId) {
    try {
      const events = await this.getCalendarEvents(calendarId);

      // Filter for events with Raid Helper ID in extended properties OR iCal UID pattern
      return events.filter(event => {
        // Check for private property (full sync events)
        if (event.extendedProperties?.private?.raidHelperId) {
          return true;
        }

        // Check for iCal UID pattern (imported events)
        if (event.iCalUID && event.iCalUID.startsWith('raid-helper-') && event.iCalUID.endsWith('@raid-helper.dev')) {
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Error fetching synced events:', error.message);
      throw error;
    }
  }
}

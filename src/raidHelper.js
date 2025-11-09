import fetch from 'node-fetch';

export class RaidHelperClient {
  constructor(apiKey, timeWindowDays = 10) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://raid-helper.dev/api/v3';
    this.timeWindowDays = timeWindowDays;
  }

  /**
   * Fetch all events for the authenticated user
   * @param {boolean} allTime - If true, fetch all events regardless of date
   * @returns {Promise<Array>} Array of event objects
   */
  async getEvents(allTime = false) {
    try {
      const response = await fetch(`${this.baseUrl}/users/${this.apiKey}/events`);

      if (!response.ok) {
        throw new Error(`Raid Helper API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let events = data.postedEvents || data || [];

      // Filter by time window unless allTime is specified
      if (!allTime && this.timeWindowDays > 0) {
        const now = Math.floor(Date.now() / 1000);
        const windowSeconds = this.timeWindowDays * 24 * 60 * 60;
        const minTime = now - windowSeconds;
        const maxTime = now + windowSeconds;

        const beforeFilter = events.length;
        events = events.filter(event => {
          return event.startTime >= minTime && event.startTime <= maxTime;
        });

        console.log(`Filtered to ±${this.timeWindowDays} days: ${beforeFilter} → ${events.length} events`);
      }

      return events;
    } catch (error) {
      console.error('Error fetching Raid Helper events:', error.message);
      throw error;
    }
  }

  /**
   * Get details for a specific event
   * @param {string} eventId - The event ID
   * @returns {Promise<Object>} Event details
   */
  async getEvent(eventId) {
    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}`);

      if (!response.ok) {
        throw new Error(`Raid Helper API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform Raid Helper event to calendar-friendly format
   * @param {Object} event - Raid Helper event object
   * @returns {Object} Formatted event data
   */
  formatEventForCalendar(event) {
    const startDate = new Date(event.startTime * 1000); // API returns Unix timestamp in seconds
    const endDate = new Date(event.endTime * 1000);

    // Build description with event details
    let description = `Raid Helper Event\n\n`;

    if (event.leaderName) {
      description += `Raid Leader: ${event.leaderName}\n`;
    }

    if (event.description) {
      description += `\n${event.description}\n`;
    }

    description += `\n🔗 View in Raid Helper: https://raid-helper.dev/event/${event.id}`;

    return {
      id: event.id,
      title: event.title || 'Raid Helper Event',
      description: description,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      location: event.leaderName ? `Led by ${event.leaderName}` : '',
      status: event.status || 'active'
    };
  }
}

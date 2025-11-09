import fetch from 'node-fetch';

// Test the Raid Helper API
const apiKey = 'uiROkOWBRjrfDsAO0pt37QoyXdakedg9TWEuH7vg';

console.log('Testing Raid Helper API - Individual Event Details\n');
console.log('='.repeat(60));

try {
  // First get the list of events
  console.log('\n1. Fetching your events list...\n');
  const response = await fetch(`https://raid-helper.dev/api/v3/users/${apiKey}/events`);
  const data = await response.json();
  const events = data?.postedEvents || data || [];

  console.log(`Found ${events.length} events\n`);

  if (events.length === 0) {
    console.log('No events found.');
    process.exit(0);
  }

  // Find a future event (not past)
  const now = Math.floor(Date.now() / 1000);
  const futureEvents = events.filter(e => e.startTime > now);

  console.log(`Future events: ${futureEvents.length}`);

  if (futureEvents.length === 0) {
    console.log('No future events found, using first event');
  }

  const testEvent = futureEvents[0] || events[0];
  console.log(`\nTesting with event: "${testEvent.title}"`);
  console.log(`Event ID: ${testEvent.id}`);
  console.log(`Start time: ${new Date(testEvent.startTime * 1000).toLocaleString()}`);
  console.log(`Signups: ${testEvent.signUpCount || testEvent.signUps?.length || 'unknown'}\n`);

  // Now fetch the web page to see if roster info is there
  console.log('2. Fetching web page for event...\n');

  const webUrl = `https://raid-helper.dev/event/${testEvent.id}`;
  console.log('URL:', webUrl);

  const detailResponse = await fetch(webUrl);
  console.log('Response Status:', detailResponse.status, detailResponse.statusText);

  const detailText = await detailResponse.text();

  // Check for roster-related keywords in HTML
  console.log('\n' + '='.repeat(60));
  console.log('CHECKING FOR ROSTER INDICATORS IN HTML:');
  console.log('='.repeat(60));

  const keywords = ['roster', 'Roster', 'confirmed', 'Confirmed', 'bench', 'Bench', 'waitlist', 'Waitlist'];

  for (const keyword of keywords) {
    if (detailText.includes(keyword)) {
      console.log(`✓ Found keyword "${keyword}" in page`);

      // Show context around the keyword
      const index = detailText.indexOf(keyword);
      const context = detailText.substring(Math.max(0, index - 100), Math.min(detailText.length, index + 200));
      console.log(`  Context: ...${context}...`);
      console.log();
    }
  }

  // Check if the page has JSON data embedded
  console.log('\n' + '='.repeat(60));
  console.log('CHECKING FOR EMBEDDED JSON DATA:');
  console.log('='.repeat(60));

  const scriptMatch = detailText.match(/<script[^>]*>(.*?)<\/script>/gs);
  if (scriptMatch) {
    console.log(`Found ${scriptMatch.length} script tags`);

    // Look for JSON-like data in scripts
    for (let i = 0; i < scriptMatch.length; i++) {
      const script = scriptMatch[i];
      if (script.includes('signUps') || script.includes('roster') || script.includes('confirmed')) {
        console.log(`\nScript ${i + 1} contains relevant data:`);
        console.log(script.substring(0, 500) + '...');
      }
    }
  }

} catch (error) {
  console.error('Error:', error.message);
  console.error('\nFull error:', error);
}

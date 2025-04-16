const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ics = require('ics');

console.log('Testing iCal file generation...');

// Create ical directory if it doesn't exist
const icalDir = path.join(__dirname, 'ical-files');
if (!fs.existsSync(icalDir)) {
  fs.mkdirSync(icalDir, { recursive: true });
  console.log(`Created directory: ${icalDir}`);
}

// Create a test event
const eventTitle = 'Test Wedding Event';
const eventDate = new Date(2025, 4, 15, 14, 30); // May 15, 2025, 2:30pm
const eventLocation = 'Test Location, 123 Test St';

// Format dates for ICS
const startArray = [
  eventDate.getFullYear(),
  eventDate.getMonth() + 1, // months are 0-indexed in JS
  eventDate.getDate(),
  eventDate.getHours(),
  eventDate.getMinutes()
];

// Calculate end time (1 hour after start)
const endDate = new Date(eventDate);
endDate.setHours(endDate.getHours() + 1);

const endArray = [
  endDate.getFullYear(),
  endDate.getMonth() + 1,
  endDate.getDate(),
  endDate.getHours(),
  endDate.getMinutes()
];

// Create the event for the ICS library
const event = {
  start: startArray,
  end: endArray,
  title: eventTitle,
  description: 'Test event description',
  location: eventLocation,
  categories: ['Event'],
  status: 'CONFIRMED',
  busyStatus: 'BUSY',
  organizer: { name: 'Test Organizer', email: 'test@example.com' },
  alarms: [
    {
      action: 'display',
      trigger: { hours: 1, minutes: 0, before: true }
    }
  ]
};

// Generate the ICS file
ics.createEvent(event, (error, value) => {
  if (error) {
    console.error('Error creating ICS file:', error);
    return;
  }
  
  // Create a unique ID for the event
  const eventId = uuidv4();
  const filename = `event-${eventId}.ics`;
  const filePath = path.join(icalDir, filename);
  
  // Write to file
  fs.writeFileSync(filePath, value);
  console.log(`✅ ICS file created successfully at: ${filePath}`);
  console.log(`File size: ${fs.statSync(filePath).size} bytes`);
  console.log('File content:');
  console.log(value);
}); 
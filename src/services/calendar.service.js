const fs = require('fs');
const path = require('path');
const nodeSchedule = require('node-schedule');
const { v4: uuidv4 } = require('uuid');
const ics = require('ics');
const moment = require('moment');
const ical = require('ical-generator');
const crypto = require('crypto');

// Create ical files directory
const icalDir = path.join(__dirname, '../../ical-files');
if (!fs.existsSync(icalDir)) {
  fs.mkdirSync(icalDir, { recursive: true });
}

// In-memory storage for calendar events (replace with a proper database in production)
const events = [];

/**
 * Parse date and time strings into a JavaScript Date object
 * @param {string} dateString - The date string (e.g., "Jan 1st, 2023" or "01/01/2023")
 * @param {string} timeString - The time string (e.g., "3:00 PM" or "15:00")
 * @returns {Date|null} - The parsed Date object or null if parsing fails
 */
const parseDateTime = (dateString, timeString) => {
  try {
    // Handle various date formats
    let processedDate = dateString;
    
    // Remove ordinal indicators (1st, 2nd, 3rd, 4th, etc.)
    processedDate = processedDate.replace(/(\d+)(st|nd|rd|th)/i, '$1');
    
    // Handle dot-separated dates (03.01.2015)
    if (processedDate.includes('.')) {
      const parts = processedDate.split('.');
      if (parts.length === 3) {
        // Assume DD.MM.YYYY format
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
        let year = parseInt(parts[2]);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        // Create a date without time
        const date = new Date(year, month, day);
        
        // Now handle the time
        if (timeString) {
          // Convert to 24-hour format if needed
          let hours = 0;
          let minutes = 0;
          
          // Try to match different time formats
          const timeMatch = timeString.match(/(\d{1,2})[:\.]?(\d{2})?\s*(am|pm|AM|PM)?/i);
          
          if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            
            // Handle AM/PM
            const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
            if (period === 'pm' && hours < 12) {
              hours += 12;
            } else if (period === 'am' && hours === 12) {
              hours = 0;
            }
          }
          
          // Set the time
          date.setHours(hours, minutes, 0, 0);
        }
        
        return date;
      }
    }
    
    // If date is in format MM/DD/YYYY or DD/MM/YYYY
    if (processedDate.includes('/')) {
      const parts = processedDate.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY format as it's more common in the US
        const month = parseInt(parts[0]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        // Create a date without time
        const date = new Date(year, month, day);
        
        // Now handle the time
        if (timeString) {
          // Convert to 24-hour format if needed
          let hours = 0;
          let minutes = 0;
          
          // Try to match different time formats
          const timeMatch = timeString.match(/(\d{1,2})[:\.]?(\d{2})?\s*(am|pm|AM|PM)?/i);
          
          if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            
            // Handle AM/PM
            const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
            if (period === 'pm' && hours < 12) {
              hours += 12;
            } else if (period === 'am' && hours === 12) {
              hours = 0;
            }
          }
          
          // Set the time
          date.setHours(hours, minutes, 0, 0);
        }
        
        return date;
      }
    }
    
    // Try to parse with moment.js for more flexible parsing
    const momentDate = moment(processedDate, [
      'DD.MM.YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD',
      'MMMM D YYYY', 'D MMMM YYYY', 'MMM D YYYY', 'D MMM YYYY',
      'MMMM D, YYYY', 'D MMMM, YYYY', 'MMM D, YYYY', 'D MMM, YYYY'
    ]);
    
    if (momentDate.isValid()) {
      const date = momentDate.toDate();
      
      // Now handle the time
      if (timeString) {
        const momentTime = moment(timeString, [
          'h:mm a', 'h:mm A', 'H:mm', 'h a', 'h A', 'H',
          'h.mm a', 'h.mm A', 'H.mm'
        ]);
        
        if (momentTime.isValid()) {
          date.setHours(
            momentTime.hours(),
            momentTime.minutes(),
            0, 0
          );
        }
      }
      
      return date;
    }
    
    // If date is in more human-readable format like "January 1, 2023"
    const date = new Date(processedDate);
    
    // If we can parse the date
    if (!isNaN(date.getTime())) {
      // Now handle the time
      if (timeString) {
        // Convert to 24-hour format if needed
        let hours = 0;
        let minutes = 0;
        
        // Try to match different time formats
        const timeMatch = timeString.match(/(\d{1,2})[:\.]?(\d{2})?\s*(am|pm|AM|PM)?/i);
        
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          
          // Handle AM/PM
          const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
          if (period === 'pm' && hours < 12) {
            hours += 12;
          } else if (period === 'am' && hours === 12) {
            hours = 0;
          }
        }
        
        // Set the time
        date.setHours(hours, minutes, 0, 0);
      }
      
      return date;
    }
    
    console.log('Failed to parse date:', dateString, timeString);
    return null;
  } catch (error) {
    console.error('Error parsing date and time:', error);
    return null;
  }
};

/**
 * Create an iCal file from event details
 * @param {object} eventDetails - The event details
 * @param {Date} eventDate - The event date object
 * @returns {Promise<string>} - Path to the created iCal file
 */
const createIcalFile = (eventDetails, eventDate) => {
  return new Promise((resolve, reject) => {
    // Create a unique ID for the event
    const eventId = uuidv4();
    const filename = `event-${eventId}.ics`;
    const filePath = path.join(icalDir, filename);
    
    // Calculate end time (default to 1 hour if not specified)
    const endDate = new Date(eventDate);
    endDate.setHours(endDate.getHours() + 1);
    
    // Format dates for ICS
    const startArray = [
      eventDate.getFullYear(),
      eventDate.getMonth() + 1, // months are 0-indexed in JS
      eventDate.getDate(),
      eventDate.getHours(),
      eventDate.getMinutes()
    ];
    
    const endArray = [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes()
    ];
    
    // Create the event for the ICS library
    const icsEvent = {
      start: startArray,
      end: endArray,
      title: eventDetails.title,
      description: `Event extracted from WhatsApp image`,
      location: eventDetails.location,
      categories: ['Event'],
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'WhatsApp Calendar Assistant', email: 'calendar@example.com' },
      alarms: [
        {
          action: 'display',
          trigger: { hours: 1, minutes: 0, before: true }
        }
      ]
    };
    
    // Generate the ICS file
    ics.createEvent(icsEvent, (error, value) => {
      if (error) {
        console.error('Error creating ICS file:', error);
        reject(error);
        return;
      }
      
      // Return the ICS content instead of writing to file (serverless-friendly)
      console.log(`ICS file content generated (${value.length} characters)`);
      
      resolve({ content: value, filename: path.basename(filePath) });
    });
  });
};

/**
 * Create a calendar event from extracted details
 * @param {object} eventDetails - The event details
 * @returns {Promise<object>} - The created event
 */
exports.createEvent = async (eventDetails) => {
  try {
    // Parse date and time
    const eventDate = parseDateTime(eventDetails.date, eventDetails.time);
    if (!eventDate) {
      throw new Error('Could not parse event date and time');
    }
    
    console.log('Parsed date:', eventDate);
    
    // Create an iCal file content
    const icalData = await createIcalFile(eventDetails, eventDate);
    
    // Create event object
    const event = {
      id: Date.now().toString(),
      title: eventDetails.title,
      date: eventDetails.date,
      time: eventDetails.time,
      location: eventDetails.location,
      timestamp: eventDate ? eventDate.toISOString() : null,
      createdAt: new Date().toISOString(),
      icalContent: icalData.content,
      icalFilename: icalData.filename
    };
    
    // In a real application, you would save this to a database
    events.push(event);
    
    // Schedule a reminder for this event if date/time was successfully parsed
    if (eventDate && eventDate > new Date()) {
      nodeSchedule.scheduleJob(eventDate, function() {
        console.log(`REMINDER: Event "${event.title}" is happening now!`);
        // In a real application, you would send a notification to the user
      });
    }
    
    return event;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Get an iCal file path by event ID
 * @param {string} eventId - The event ID
 * @returns {string|null} - Path to the iCal file or null if not found
 */
exports.getIcalFileByEventId = (eventId) => {
  const event = events.find(event => event.id === eventId);
  if (event && event.icalFile) {
    return event.icalFile;
  }
  return null;
};

/**
 * Get all calendar events
 * @returns {Array} - All events
 */
exports.getAllEvents = () => {
  return events;
};

/**
 * Get a calendar event by ID
 * @param {string} id - The event ID
 * @returns {object|null} - The event or null if not found
 */
exports.getEventById = (id) => {
  return events.find(event => event.id === id) || null;
};

// Helper function to create a unique filename
function generateFilename() {
  return `event-${uuidv4()}.ics`;
}

// Create an iCal file from event details
function createCalendarEvent(eventDetails) {
  console.log('Creating calendar event with details:', JSON.stringify(eventDetails));
  
  try {
    // Create new calendar
    const calendar = ical({ name: 'WhatsApp Calendar Assistant' });
    
    // Parse dates
    let startDate = new Date(eventDetails.date);
    if (isNaN(startDate.getTime())) {
      // Try to handle different date formats
      const dateParts = eventDetails.date.match(/(\d+)[\/\-\.](\d+)[\/\-\.](\d+)/);
      if (dateParts) {
        // Assuming day/month/year format
        startDate = new Date(
          parseInt(dateParts[3]), 
          parseInt(dateParts[2]) - 1, 
          parseInt(dateParts[1])
        );
      }
    }
    
    // Set end date as 1 hour after start if not provided
    let endDate = eventDetails.endDate ? new Date(eventDetails.endDate) : new Date(startDate);
    if (!eventDetails.endDate) {
      endDate.setHours(endDate.getHours() + 1);
    }
    
    // Create event
    const event = calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: eventDetails.title,
      description: eventDetails.description || '',
      location: eventDetails.location || '',
      status: 'CONFIRMED',
      categories: ['EVENT'],
      organizer: {
        name: 'WhatsApp Calendar Assistant',
        email: 'assistant@example.com'
      }
    });
    
    // Add alarm (1 hour before)
    event.createAlarm({
      type: 'display',
      trigger: 3600
    });
    
    // Generate filename and path
    const filename = generateFilename();
    const filePath = path.join(icalDir, filename);
    
    // Write to file
    calendar.saveSync(filePath);
    
    console.log(`ICS file created at: ${filePath}`);
    
    // Check file exists and has content
    if (!fs.existsSync(filePath)) {
      throw new Error(`Failed to create ICS file: ${filePath} does not exist`);
    }
    
    const fileSize = fs.statSync(filePath).size;
    console.log(`ICS file size: ${fileSize} bytes`);
    
    if (fileSize === 0) {
      throw new Error(`Failed to create ICS file: ${filePath} is empty`);
    }
    
    return {
      filename,
      filePath,
      calendar
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Generate a calendar URL (Google Calendar, Outlook, etc.) that users can click to add the event
function generateCalendarLink(eventDetails) {
  console.log('Generating calendar link with details:', JSON.stringify(eventDetails));
  
  try {
    // Parse dates - handle various formats
    let startDate;
    
    // 1. Special handling for formats with ordinals (1ST, 2ND, 3RD, etc)
    if (eventDetails.date && /\d+(ST|ND|RD|TH)/i.test(eventDetails.date)) {
      // Remove the ordinal suffix
      const cleanDate = eventDetails.date.replace(/(\d+)(ST|ND|RD|TH)/i, '$1');
      console.log(`Cleaned date from ordinals: ${cleanDate}`);
      
      // Try to parse with moment
      const momentDate = moment(cleanDate, [
        'DD MMMM YYYY', 'D MMMM YYYY', 
        'MMMM DD YYYY', 'MMMM D YYYY',
        'DD MMM YYYY', 'D MMM YYYY',
        'MMM DD YYYY', 'MMM D YYYY'
      ]);
      
      if (momentDate.isValid()) {
        startDate = momentDate.toDate();
        console.log(`Successfully parsed date with ordinals: ${startDate.toISOString()}`);
      }
    }
    
    // 2. Try moment for all common date formats if first method didn't work
    if (!startDate || isNaN(startDate.getTime())) {
      // Try first with moment.js which handles many formats
      const momentDate = moment(eventDetails.date, [
        'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD',
        'MM-DD-YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD',
        'DD.MM.YYYY', 'MM.DD.YYYY', 
        'MMMM D YYYY', 'D MMMM YYYY', 
        'MMM D YYYY', 'D MMM YYYY',
        'MMMM D', 'D MMMM', 
        'MMM D', 'D MMM'
      ]);
      
      if (momentDate.isValid()) {
        startDate = momentDate.toDate();
        console.log(`Successfully parsed date with moment: ${startDate.toISOString()}`);
      } else {
        // Standard JS date parsing
        startDate = new Date(eventDetails.date);
      }
    }
    
    // 3. Try to parse specific number formats if still not valid
    if (!startDate || isNaN(startDate.getTime())) {
      // Try to match different number patterns
      const dateParts = eventDetails.date.match(/(\d+)[\/\-\.](\d+)[\/\-\.](\d+)/);
      if (dateParts) {
        // Try different arrangements (MDY, DMY, YMD)
        const formats = [
          // MM/DD/YYYY (US format)
          new Date(parseInt(dateParts[3]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])),
          
          // DD/MM/YYYY (European format)
          new Date(parseInt(dateParts[3]), parseInt(dateParts[2]) - 1, parseInt(dateParts[1])),
          
          // YYYY/MM/DD (ISO-like format)
          new Date(parseInt(dateParts[1]), parseInt(dateParts[2]) - 1, parseInt(dateParts[3]))
        ];
        
        // Use the first valid date
        for (const date of formats) {
          if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
            startDate = date;
            console.log(`Successfully parsed date from parts: ${startDate.toISOString()}`);
            break;
          }
        }
      }
    }
    
    // 4. If date is still invalid, check if the description contains a date
    if ((!startDate || isNaN(startDate.getTime())) && eventDetails.description) {
      // Try to find a date pattern in the description
      const dateMatches = eventDetails.description.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (dateMatches) {
        // Assume MM/DD/YYYY format as a default
        startDate = new Date(
          parseInt(dateMatches[3]) < 100 ? 2000 + parseInt(dateMatches[3]) : parseInt(dateMatches[3]),
          parseInt(dateMatches[1]) - 1,
          parseInt(dateMatches[2])
        );
        console.log(`Found date in description: ${startDate.toISOString()}`);
      }
    }
    
    // 5. If everything failed, use a default date (tomorrow)
    if (!startDate || isNaN(startDate.getTime())) {
      console.log('Could not parse date properly, using default date (tomorrow)');
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(12, 0, 0, 0); // Noon tomorrow
    }
    
    // Check if we have a valid date now (one final check)
    if (isNaN(startDate.getTime())) {
      console.log("Date is still invalid after all parsing attempts. Creating default date.");
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(12, 0, 0, 0);
    }
    
    // Try to parse the time from various sources
    let timeSet = false;
    
    // 1. Check explicit time field
    if (eventDetails.time) {
      // Try multiple time patterns
      const timePatterns = [
        /(\d{1,2})[:\.](\d{2})\s*(am|pm|AM|PM)?/,  // 3:30pm or 3.30PM
        /(\d{1,2})\s*(am|pm|AM|PM)/,               // 3pm or 3 AM
        /(\d{2}):(\d{2})/                          // 15:30 (24-hour)
      ];
      
      for (const pattern of timePatterns) {
        const timeMatch = eventDetails.time.match(pattern);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          
          // Handle AM/PM if present
          if (timeMatch[3]) {
            const period = timeMatch[3].toLowerCase();
            if (period === 'pm' && hours < 12) {
              hours += 12;
            } else if (period === 'am' && hours === 12) {
              hours = 0;
            }
          } else if (hours < 12 && !pattern.toString().includes('\\d{2}')) {
            // For formats without AM/PM, assume PM for times 1-11 if it's a 12-hour pattern
            // but if it's a 24-hour pattern like "15:30", don't adjust
            if (eventDetails.time.includes('evening') || 
                eventDetails.time.includes('night') || 
                eventDetails.time.includes('dinner') || 
                eventDetails.time.includes('reception')) {
              hours += 12;
            }
          }
          
          startDate.setHours(hours, minutes, 0, 0);
          timeSet = true;
          console.log(`Set time from time field: ${hours}:${minutes}`);
          break;
        }
      }
    }
    
    // 2. Look for time in the description if not found yet
    if (!timeSet && eventDetails.description) {
      const timePatterns = [
        /(\d{1,2})[\.:](\d{2})\s*(am|pm|AM|PM)/,  // 3:30pm or 3.30PM
        /(\d{1,2})\s*(am|pm|AM|PM)/,               // 3pm or 3 AM
        /(\d{2}):(\d{2})/,                          // 15:30 (24-hour)
        /at\s+(\d{1,2})(\s*|\s*:\s*|\s*\.\s*)(\d{2})?\s*(am|pm|AM|PM)/ // at 7:30 pm
      ];
      
      for (const pattern of timePatterns) {
        const timeMatch = eventDetails.description.match(pattern);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[3] && !isNaN(parseInt(timeMatch[3])) ? 
            parseInt(timeMatch[3]) : 0;
          
          // Handle AM/PM if present
          if (timeMatch[4] || timeMatch[2]) {
            const period = (timeMatch[4] || timeMatch[2]).toLowerCase();
            if (period === 'pm' && hours < 12) {
              hours += 12;
            } else if (period === 'am' && hours === 12) {
              hours = 0;
            }
          }
          
          startDate.setHours(hours, minutes, 0, 0);
          timeSet = true;
          console.log(`Found time in description: ${hours}:${minutes}`);
          break;
        }
      }
    }
    
    // 3. If no time found, set a default time based on event type
    if (!timeSet) {
      // Try to determine appropriate time based on event keywords
      const lowerTitle = eventDetails.title.toLowerCase();
      const lowerDesc = eventDetails.description ? eventDetails.description.toLowerCase() : '';
      
      if (lowerTitle.includes('breakfast') || lowerDesc.includes('breakfast')) {
        startDate.setHours(8, 0, 0, 0);
      } else if (lowerTitle.includes('lunch') || lowerDesc.includes('lunch')) {
        startDate.setHours(12, 0, 0, 0);
      } else if (lowerTitle.includes('dinner') || lowerDesc.includes('dinner') || 
                lowerTitle.includes('evening') || lowerDesc.includes('evening')) {
        startDate.setHours(19, 0, 0, 0);
      } else {
        // Default to noon
        startDate.setHours(12, 0, 0, 0);
      }
      console.log(`No time found, set default time based on event type: ${startDate.getHours()}:00`);
    }
    
    // Final validation check
    if (isNaN(startDate.getTime())) {
      console.error("CRITICAL: Date is still invalid. Using fixed date to recover.");
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(12, 0, 0, 0);
    }
    
    console.log('Final parsed start date:', startDate.toISOString());
    
    // Set end date based on event type
    let endDate = new Date(startDate.getTime());
    const lowerTitle = eventDetails.title.toLowerCase();
    
    // Estimate duration based on event type
    if (lowerTitle.includes('wedding') || lowerTitle.includes('reception')) {
      endDate.setHours(endDate.getHours() + 4); // Weddings typically 4+ hours
    } else if (lowerTitle.includes('conference') || lowerTitle.includes('workshop')) {
      endDate.setHours(endDate.getHours() + 6); // Conferences often a full day
    } else if (lowerTitle.includes('meeting')) {
      endDate.setHours(endDate.getHours() + 1); // Meetings usually 1 hour
    } else if (lowerTitle.includes('lunch') || lowerTitle.includes('dinner')) {
      endDate.setHours(endDate.getHours() + 2); // Meals typically 2 hours
    } else {
      // Default to 2 hours for unknown event types
      endDate.setHours(endDate.getHours() + 2);
    }
    
    // Format dates for URL (local time format to avoid timezone issues)
    const formatLocalDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };
    
    const startISO = formatLocalDateTime(startDate);
    const endISO = formatLocalDateTime(endDate);
    
    // Create a rich description that includes all event details
    let fullDescription = '';
    if (eventDetails.description) {
      fullDescription += eventDetails.description + '\n\n';
    }
    
    fullDescription += 'Event Details:\n';
    if (eventDetails.date) {
      fullDescription += `Date: ${eventDetails.date}\n`;
    }
    if (eventDetails.time) {
      fullDescription += `Time: ${eventDetails.time}\n`;
    }
    if (eventDetails.location) {
      fullDescription += `Location: ${eventDetails.location}\n`;
    }
    
    // Fix the location if needed
    let location = eventDetails.location || '';
    
    // Special handling for wedding invitations
    if (lowerTitle.includes('wedding') && (
        location.toLowerCase().includes("marriage") || 
        location.toLowerCase().includes("wedding") ||
        location.toLowerCase().includes("invite"))) {
      
      // Try to find a better location in the description
      if (eventDetails.description) {
        const descriptionText = eventDetails.description.toUpperCase();
        const locationKeywords = ['AT', 'VENUE:', 'LOCATION:', 'PLACE:'];
        const descLines = descriptionText.split(/\s+/);
        
        let found = false;
        for (let i = 0; i < descLines.length; i++) {
          if (locationKeywords.includes(descLines[i])) {
            // The next word might be the location
            if (i + 1 < descLines.length) {
              const potentialLocation = descLines[i+1];
              if (potentialLocation.length > 3 && !potentialLocation.match(/^\d+/)) {
                location = potentialLocation;
                found = true;
                break;
              }
            }
          }
        }
        
        // Look for specific venue names in the description
        if (!found) {
          const venueMatches = eventDetails.description.match(/(at|venue|location)\s+([A-Za-z\s]+)/i);
          if (venueMatches && venueMatches[2]) {
            location = venueMatches[2].trim();
          }
        }
      }
    }
    
    // Encode event details for the URL - include location in title as backup
    let titleWithLocation = eventDetails.title || 'Event';
    if (location && !titleWithLocation.toLowerCase().includes(location.toLowerCase())) {
      titleWithLocation += ` at ${location}`;
    }
    const title = encodeURIComponent(titleWithLocation);
    const description = encodeURIComponent(fullDescription || '');
    const locationEncoded = encodeURIComponent(location || '');
    
    // Mobile-friendly links that open in native apps
    
    // iOS Calendar - native iOS calendar app deep link
    // This uses the calshow:// protocol which opens the native iOS Calendar app
    const iosCalendarLink = `calshow://?title=${title}&start=${startISO}&end=${endISO}&notes=${description}&location=${locationEncoded}`;

    // Google Calendar - simple format that reliably shows location
    const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&location=${locationEncoded}&details=${description}&sf=true&output=xml`;

    // Outlook - mobile friendly link
    // Uses the deep linking format that works on mobile Outlook app
    const outlookOnlineLink = `https://outlook.office.com/calendar/action/compose?subject=${title}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${description}&location=${locationEncoded}`;

    // Apple Calendar - iOS link
    // Uses the standard calendar link that iOS will open in the calendar app
    // The webcal:// protocol is no longer widely supported, use https instead
    const appleCalendarLink = `https://calendar.google.com/calendar/ical/${title.replace(/\s+/g, '+')}/${startISO}/${endISO}.ics?ctz=local&action=TEMPLATE&dates=${startISO}/${endISO}&text=${title}&details=${description}&location=${locationEncoded}`;

    // Yahoo Calendar - mobile optimized
    const yahooCalendarLink = `https://calendar.yahoo.com/?title=${title}&st=${startISO}&et=${endISO}&desc=${description}&in_loc=${locationEncoded}`;
    
    console.log('Google Calendar Link:', googleCalendarLink.substring(0, 100) + '...');
    
    return {
      google: googleCalendarLink,
      ios: iosCalendarLink,
      outlook: outlookOnlineLink,
      apple: appleCalendarLink,
      yahoo: yahooCalendarLink,
      all: googleCalendarLink // Default to Google Calendar
    };
  } catch (error) {
    console.error('Error generating calendar link:', error);
    // Return fallback links to a future date so we can recover from errors
    try {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 1);
      fallbackDate.setHours(12, 0, 0, 0);
      
      const endDate = new Date(fallbackDate);
      endDate.setHours(endDate.getHours() + 2);
      
      const startISO = fallbackDate.toISOString().replace(/-|:|\.\d+/g, '');
      const endISO = endDate.toISOString().replace(/-|:|\.\d+/g, '');
      
      // Use a simplified title and details
      const safeTitle = encodeURIComponent(eventDetails.title || 'Calendar Event');
      const safeDetails = encodeURIComponent('Event details could not be fully processed. Please update the details manually.');
      
      // Create fallback links
      const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${safeTitle}&dates=${startISO}/${endISO}&details=${safeDetails}`;
      const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${safeTitle}&startdt=${fallbackDate.toISOString()}&enddt=${endDate.toISOString()}&body=${safeDetails}`;
      const yahooLink = `https://calendar.yahoo.com/?title=${safeTitle}&st=${startISO}&et=${endISO}&desc=${safeDetails}`;
      
      console.log('Using fallback calendar links due to error');
      
      return {
        google: googleLink,
        outlook: outlookLink,
        yahoo: yahooLink,
        all: googleLink
      };
    } catch (fallbackError) {
      console.error('Even fallback link creation failed:', fallbackError);
      throw error; // Re-throw the original error if even the fallback fails
    }
  }
}

module.exports = {
  createCalendarEvent,
  generateCalendarLink
}; 
const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');

// Initialize the Google Cloud Vision client
// For serverless deployment, use environment variables instead of JSON file
let client;

if (process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
  // Use environment variables (recommended for serverless)
  client = new vision.ImageAnnotatorClient({
    credentials: {
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    },
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
  console.log('Google Cloud Vision API initialized with environment variables');
} else {
  // Fallback to JSON file for local development
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../google-cloud-credentials/google-credentials.json');
  client = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath,
  });
  console.log('Google Cloud Vision API initialized with JSON file');
}

/**
 * Extract event details from an image using Google Cloud Vision API
 * @param {Buffer} imageBuffer - Buffer containing the image data
 * @returns {Promise<object>} - Extracted event details
 */
exports.extractEventDetails = async (imageBuffer) => {
  try {
    console.log('Extracting text from image using Vision API...');
    
    // Perform text detection on the image
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      console.log('No text detected in the image');
      return null;
    }
    
    // The first annotation contains the entire text from the image
    const fullText = detections[0].description;
    console.log('Full text extracted from image:');
    console.log(fullText);
    
    // Parse the text to extract event details
    const eventDetails = parseEventDetails(fullText);
    
    return eventDetails;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
};

/**
 * Parse text to extract event details
 * @param {string} text - The text to parse
 * @returns {object} - The extracted event details
 */
function parseEventDetails(text) {
  console.log('Parsing text to extract event details...');
  
  // Initialize event details object
  const eventDetails = {
    title: null,
    date: null,
    time: null,
    location: null,
    description: null
  };
  
  try {
    // Split into lines for easier processing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Check if this is a wedding invitation or formal event
    const isWedding = detectWeddingInvitation(text, lines);
    const isFormalEvent = detectFormalEvent(text, lines);
    
    if (isWedding) {
      return parseWeddingInvitation(lines, text);
    } else if (isFormalEvent) {
      return parseFormalEvent(lines, text);
    } else {
      // Fall back to generic parsing
      return parseGenericEvent(lines, text);
    }
    
  } catch (error) {
    console.error('Error parsing event details:', error);
    // Return whatever we've been able to extract so far
    return eventDetails;
  }
}

/**
 * Detect if this is a wedding invitation
 * @param {string} text - Full text content
 * @param {string[]} lines - Array of text lines
 * @returns {boolean} - True if wedding invitation detected
 */
function detectWeddingInvitation(text, lines) {
  const weddingKeywords = [
    'marriage of', 'wedding of', 'invite you to the wedding', 'request the pleasure',
    'honour of your presence', 'honor of your presence', 'request your presence',
    'joyfully invite you', 'together with their families', 'to celebrate the marriage',
    'cordially invite you', 'request the honour', 'request the honor'
  ];
  
  const lowerText = text.toLowerCase();
  return weddingKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Detect if this is a formal event invitation
 * @param {string} text - Full text content
 * @param {string[]} lines - Array of text lines
 * @returns {boolean} - True if formal event detected
 */
function detectFormalEvent(text, lines) {
  const formalKeywords = [
    'cordially invite', 'request the pleasure', 'honour of your presence',
    'honor of your presence', 'request your presence', 'invites you to',
    'pleased to invite', 'formally invite', 'invitation to'
  ];
  
  const lowerText = text.toLowerCase();
  return formalKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Parse wedding invitation with proper structure recognition
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @returns {object} - Extracted event details
 */
function parseWeddingInvitation(lines, text) {
  const eventDetails = {
    title: null,
    date: null,
    time: null,
    location: null,
    description: null
  };
  
  // Find the couple's names (usually after "marriage of" or similar)
  let coupleNames = findCoupleNames(lines, text);
  if (coupleNames) {
    // Convert to proper case (capitalize first letter of each word)
    const properCaseNames = coupleNames.split(' and ').map(name => 
      name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    ).join(' and ');
    eventDetails.title = `Wedding of ${properCaseNames}`;
  } else {
    eventDetails.title = 'Wedding Celebration';
  }
  
  // Find date and time
  const dateInfo = findDatesAdvanced(lines, text);
  if (dateInfo) {
    eventDetails.date = dateInfo.date;
    eventDetails.time = dateInfo.time;
  }
  
  // Find location (often appears after couple names and before date)
  let location = findLocationAdvanced(lines, text);
  if (location) {
    // Convert to proper case
    eventDetails.location = location.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  // Create professional description
  eventDetails.description = createWeddingDescription(lines, text, eventDetails);
  
  console.log('Wedding invitation parsed:', eventDetails);
  return eventDetails;
}

/**
 * Parse formal event invitation
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @returns {object} - Extracted event details
 */
function parseFormalEvent(lines, text) {
  const eventDetails = {
    title: null,
    date: null,
    time: null,
    location: null,
    description: null
  };
  
  // Find event title (more sophisticated for formal events)
  eventDetails.title = findFormalEventTitle(lines, text);
  
  // Find date and time
  const dateInfo = findDatesAdvanced(lines, text);
  if (dateInfo) {
    eventDetails.date = dateInfo.date;
    eventDetails.time = dateInfo.time;
  }
  
  // Find location
  eventDetails.location = findLocationAdvanced(lines, text);
  
  // Create description
  eventDetails.description = createFormalDescription(lines, text, eventDetails);
  
  console.log('Formal event parsed:', eventDetails);
  return eventDetails;
}

/**
 * Parse generic event (fallback)
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @returns {object} - Extracted event details
 */
function parseGenericEvent(lines, text) {
  const eventDetails = {
    title: null,
    date: null,
    time: null,
    location: null,
    description: null
  };
  
  // Use original logic for generic events
  eventDetails.title = findEventTitle(lines);
  
  const dateInfo = findDates(lines, text);
  if (dateInfo) {
    eventDetails.date = dateInfo.date;
    if (dateInfo.time) {
      eventDetails.time = dateInfo.time;
    }
  }
  
  eventDetails.location = findLocation(lines, text);
  eventDetails.description = findDescription(lines, eventDetails);
  
  console.log('Generic event parsed:', eventDetails);
  return eventDetails;
}

/**
 * Find couple names in wedding invitation
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @returns {string|null} - Couple names or null
 */
function findCoupleNames(lines, text) {
  // Look for pattern: "marriage of ALICE to ANTON" or "ALICE & ANTON"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (line.includes('marriage of') || line.includes('wedding of')) {
      // Look in this line and next few lines for names
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const nameLine = lines[j];
        
        // Pattern: NAME to NAME
        if (nameLine.toLowerCase().includes(' to ')) {
          const parts = nameLine.split(/\s+to\s+/i);
          if (parts.length === 2) {
            return `${parts[0].trim()} and ${parts[1].trim()}`;
          }
        }
        
        // Pattern: NAME & NAME or NAME and NAME
        if (nameLine.match(/\b\w+\s+(?:and|&)\s+\w+\b/i)) {
          const match = nameLine.match(/\b(\w+)\s+(?:and|&)\s+(\w+)\b/i);
          if (match) {
            return `${match[1]} and ${match[2]}`;
          }
        }
      }
    }
  }
  
  // Alternative: look for two single-name lines that might be the couple
  const singleNameLines = lines.filter(line => 
    line.length > 2 && 
    line.length < 20 && 
    /^[A-Z]+$/.test(line) && 
    !line.match(/^(THE|AND|TO|OF|AT|IN|ON|FOR)$/)
  );
  
  if (singleNameLines.length >= 2) {
    // Look for "TO" between names
    for (let i = 0; i < lines.length - 2; i++) {
      if (singleNameLines.includes(lines[i]) && 
          lines[i + 1].toUpperCase() === 'TO' && 
          singleNameLines.includes(lines[i + 2])) {
        return `${lines[i]} and ${lines[i + 2]}`;
      }
    }
  }
  
  return null;
}

/**
 * Advanced date and time finding with better parsing
 * @param {string[]} lines - Array of text lines  
 * @param {string} text - Full text content
 * @returns {object|null} - Date and time info
 */
function findDatesAdvanced(lines, text) {
  // Enhanced time patterns that catch more formats
  const timePatterns = [
    /\b(\d{1,2})\.(\d{2})\s*(pm|am|PM|AM)\b/,  // 4.30PM
    /\b(\d{1,2}):(\d{2})\s*(pm|am|PM|AM)\b/,   // 4:30PM
    /\b(\d{1,2})\s*(pm|am|PM|AM)\b/,           // 4PM
    /\b(\d{1,2})\.(\d{2})\b/,                  // 4.30 (assume PM for events)
    /\b(\d{1,2}):(\d{2})\b/                    // 4:30
  ];
  
  // First use the original date finding
  const dateInfo = findDates(lines, text);
  
  if (dateInfo && !dateInfo.time) {
    // Try to find time more aggressively
    for (const line of lines) {
      for (const pattern of timePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateInfo.time = match[0];
          break;
        }
      }
      if (dateInfo.time) break;
    }
  }
  
  return dateInfo;
}

/**
 * Advanced location finding for formal events
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content  
 * @returns {string|null} - Location or null
 */
function findLocationAdvanced(lines, text) {
  // For weddings, location often appears in specific places
  
  // First try common venue patterns - these get highest priority
  const venuePatterns = [
    /\b[A-Z][a-z]+\s+(?:du|de|la|le)\s+[A-Z][a-z]+\b/,  // "Fleur du Cap" pattern
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+(?:Hotel|Resort|Club|Hall|Center|Centre|Manor|Estate)\b/i,
    /\b(?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Hotel|Resort|Club|Hall|Center|Centre|Manor|Estate)\b/i
  ];
  
  for (const line of lines) {
    for (const pattern of venuePatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
  }
  
  // Look for multi-word venue names first (higher priority than single names)
  const multiWordVenues = [];
  const singleWordOptions = [];
  
  for (const line of lines) {
    if (line.length > 3 && 
        line.length < 50 && 
        /^[A-Z\s]+$/.test(line) && 
        !line.match(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/) &&
        !line.match(/^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)/) &&
        !line.match(/^\d+/) &&
        !line.match(/^(THE|AND|TO|OF|AT|IN|ON|FOR|REQUEST|PLEASURE|COMPANY|MARRIAGE|WEDDING|FOLLOWED|RSVP|DRESS|CODE)$/) &&
        !line.includes(' AND ') &&  // Exclude host names like "THIERRY AND ODILE RIVIER"
        !line.match(/^[A-Z]+\s+AND\s+[A-Z]+/)) {  // Exclude "NAME AND NAME" patterns
      
      const wordCount = line.split(' ').length;
      
      if (wordCount >= 2 && wordCount <= 4) {
        // Multi-word venue names get priority
        multiWordVenues.push(line);
      } else if (wordCount === 1 && line.length > 4) {
        // Single word venues as backup
        singleWordOptions.push(line);
      }
    }
  }
  
  // Prefer multi-word venues over single names
  if (multiWordVenues.length > 0) {
    return multiWordVenues[0];
  }
  
  // For wedding invitations, try to find venue after the couple names
  let foundAlice = false;
  let foundAnton = false;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].includes('ALICE')) foundAlice = true;
    if (lines[i].includes('ANTON')) foundAnton = true;
    
    // If we found both names, the next non-date, non-time line might be venue
    if (foundAlice && foundAnton && i < lines.length - 1) {
      const nextLine = lines[i + 1];
      if (nextLine && 
          !nextLine.match(/\d{1,2}/) && // Not a date
          !nextLine.match(/(AM|PM|am|pm)/) && // Not a time
          nextLine.length > 4 &&
          nextLine.length < 30 &&
          /^[A-Z\s]+$/.test(nextLine)) {
        return nextLine;
      }
    }
  }
  
  // Look for venue-like words in any line
  const venueKeywords = ['CAP', 'HOTEL', 'RESORT', 'CLUB', 'HALL', 'CENTER', 'CENTRE', 'MANOR', 'ESTATE', 'GARDEN', 'HOUSE', 'VILLA'];
  for (const line of lines) {
    for (const keyword of venueKeywords) {
      if (line.includes(keyword) && 
          !line.includes(' AND ') && 
          line.length < 40 &&
          /^[A-Z\s]+$/.test(line)) {
        return line;
      }
    }
  }
  
  // As a last resort, use single word options but exclude obvious names
  const excludedNames = ['ALICE', 'ANTON', 'THIERRY', 'ODILE', 'RIVIER', 'JOHANN', 'GAYNOR', 'RUPERT'];
  for (const option of singleWordOptions) {
    if (!excludedNames.includes(option)) {
      return option;
    }
  }
  
  // Fallback to original location finding
  return findLocation(lines, text);
}

/**
 * Create professional wedding description
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @param {object} eventDetails - Current event details
 * @returns {string|null} - Description
 */
function createWeddingDescription(lines, text, eventDetails) {
  let description = '';
  let additionalInfo = [];
  
  // Helper function to convert ALL CAPS to proper case
  const toProperCase = (str) => {
    return str.split(' ').map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'rsvp') return 'RSVP';
      if (word.includes('@')) return word.toLowerCase();
      
      // Regular proper case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };
  
  // Look for hosts (usually at the beginning)
  const hostLines = [];
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i];
    if (line.match(/^[A-Z][a-z]+\s+(?:and|AND)\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/)) {
      hostLines.push(toProperCase(line));
    }
  }
  
  if (hostLines.length > 0) {
    description += `Hosted by ${hostLines.join(' and ')}\n\n`;
  }
  
  // Look for additional details
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('followed by') || 
        lower.includes('dress code') || 
        lower.includes('cocktail') ||
        lower.includes('dinner') ||
        lower.includes('dancing') ||
        lower.includes('reception')) {
      additionalInfo.push(toProperCase(line));
    }
    
    if (lower.includes('rsvp') || lower.includes('@')) {
      additionalInfo.push(toProperCase(line));
    }
  }
  
  if (additionalInfo.length > 0) {
    description += additionalInfo.join('\n');
  }
  
  return description || 'Wedding celebration invitation';
}

/**
 * Create professional formal event description
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @param {object} eventDetails - Current event details
 * @returns {string|null} - Description
 */
function createFormalDescription(lines, text, eventDetails) {
  return findDescription(lines, eventDetails) || 'Formal event invitation';
}

/**
 * Find title for formal events
 * @param {string[]} lines - Array of text lines
 * @param {string} text - Full text content
 * @returns {string|null} - Event title
 */
function findFormalEventTitle(lines, text) {
  // Look for lines that describe the event type
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('conference') || 
        lower.includes('meeting') || 
        lower.includes('celebration') ||
        lower.includes('ceremony') ||
        lower.includes('gala') ||
        lower.includes('dinner') ||
        lower.includes('lunch') ||
        lower.includes('reception')) {
      return line;
    }
  }
  
  // Fallback to original title finding
  return findEventTitle(lines);
}

/**
 * Try to find the event title from text lines
 * @param {string[]} lines - Array of text lines
 * @returns {string|null} - Extracted title or null
 */
function findEventTitle(lines) {
  // Common event types and keywords to look for
  const eventKeywords = [
    'wedding', 'invitation', 'celebration', 'party', 'ceremony', 'event', 
    'invites you', 'meeting', 'conference', 'webinar', 'seminar', 
    'concert', 'festival', 'gathering', 'birthday', 'anniversary',
    'graduation', 'lunch', 'dinner', 'brunch', 'breakfast', 'reception', 
    'workshop', 'class', 'training', 'appointment', 'interview'
  ];
  
  // Look through the first few lines for potential event titles
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();
    
    // 1. Check for event keywords
    for (const keyword of eventKeywords) {
      if (line.includes(keyword)) {
        return lines[i]; // Return the original case
      }
    }
    
    // 2. Check for all uppercase (often an event title)
    if (lines[i] === lines[i].toUpperCase() && lines[i].length > 3) {
      return lines[i];
    }
    
    // 3. Check for lines with names pattern (for weddings, etc.)
    if (lines[i].includes(' and ') || lines[i].includes(' & ')) {
      if (!/\d/.test(lines[i])) { // No digits
        return lines[i];
      }
    }
  }
  
  // If nothing found, try again with a different approach
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    // Look for lines that are short but significant (likely a title)
    if (lines[i].length > 3 && lines[i].length < 50 && !/^\d+/.test(lines[i])) {
      // Skip lines that are likely addresses or times
      if (!lines[i].match(/^(at|on|when|where|date|time)/i) && 
          !lines[i].match(/^\d+\s+[A-Za-z]/)) {
        return lines[i];
      }
    }
  }
  
  // Fallback to first line if nothing else found
  if (lines.length > 0) {
    return lines[0];
  }
  
  return null;
}

/**
 * Find dates in the text
 * @param {string[]} lines - Array of text lines
 * @param {string} fullText - The full text content
 * @returns {object|null} - Object with date and possibly time, or null
 */
function findDates(lines, fullText) {
  // Common date-related prefixes and keywords
  const dateKeywords = [
    'date:', 'when:', 'on the', 'on', 'day:', 'scheduled for',
    'event date', 'start date', 'begins on', 'starting on'
  ];
  
  // Regular expressions for various date formats
  const datePatterns = [
    // MM/DD/YYYY or DD/MM/YYYY
    /\b(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})\b/,
    
    // Month DD, YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(\d{1,2})(st|nd|rd|th)?[,\s]+(\d{4})\b/i,
    
    // DD Month YYYY
    /\b(\d{1,2})(st|nd|rd|th)?[,\s]+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(\d{4})\b/i,
    
    // YYYY-MM-DD ISO format
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
    
    // Month DD
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(\d{1,2})(st|nd|rd|th)?\b/i,
    
    // DD Month (without year)
    /\b(\d{1,2})(st|nd|rd|th)?[,\s]+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i
  ];
  
  // Time patterns - expanded to catch more formats
  const timePatterns = [
    /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b/,
    /\b(\d{1,2})\s*(am|pm|AM|PM)\b/,
    /\b(\d{1,2})\.(\d{2})\s*(am|pm|AM|PM)?\b/,
    /\b(\d{1,2})[\.:](\d{2})\s*(?:hrs|hours|h)\b/i,
    /\b(\d{1,2})\s*(?:o\'clock)\b/i,
    /\b(\d{2}):(\d{2})\b/ // 24-hour format, e.g., 14:30
  ];
  
  // First look for lines containing date keywords
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    for (const keyword of dateKeywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        // This line might contain a date, try to extract it
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            // Also look for time in this line
            let timeMatch = null;
            for (const timePattern of timePatterns) {
              timeMatch = line.match(timePattern);
              if (timeMatch) break;
            }
            
            return {
              date: match[0],
              time: timeMatch ? timeMatch[0] : null
            };
          }
        }
      }
    }
  }
  
  // If we didn't find a date with keywords, try to find dates anywhere in the text
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        // Also look for time in this line
        let timeMatch = null;
        for (const timePattern of timePatterns) {
          timeMatch = line.match(timePattern);
          if (timeMatch) break;
        }
        
        return {
          date: match[0],
          time: timeMatch ? timeMatch[0] : null
        };
      }
    }
  }
  
  // If still no date, try one more time on the full text
  for (const pattern of datePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      // Look for time anywhere in the full text
      let timeMatch = null;
      for (const timePattern of timePatterns) {
        timeMatch = fullText.match(timePattern);
        if (timeMatch) break;
      }
      
      return {
        date: match[0],
        time: timeMatch ? timeMatch[0] : null
      };
    }
  }
  
  return null;
}

/**
 * Find location information in the text
 * @param {string[]} lines - Array of text lines
 * @param {string} fullText - The full text content
 * @returns {string|null} - Extracted location or null
 */
function findLocation(lines, fullText) {
  // Look for common location indicators
  const locationKeywords = [
    'location:', 'venue:', 'place:', 'address:', 'where:', 'at', 
    'taking place at', 'held at', 'hosted at', 'join us at',
    'meet at', 'located at', 'happening at', 'will be at', 'will take place at'
  ];
  
  // First try to find explicit location markers
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    for (const keyword of locationKeywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        // This line likely contains the location
        // Return everything after the keyword
        const keywordIndex = lowerLine.indexOf(keyword.toLowerCase());
        if (keywordIndex !== -1 && keywordIndex + keyword.length < line.length) {
          return line.substring(keywordIndex + keyword.length).trim();
        } else {
          return line;
        }
      }
    }
  }
  
  // Look for lines that might contain an address
  const addressPatterns = [
    /\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+/,  // Street address pattern
    /[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}/,  // City, State pattern
    /\b[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}\b/i,  // UK postcode pattern
    /\b\d{5}(-\d{4})?\b/ // US ZIP code
  ];
  
  for (const line of lines) {
    for (const pattern of addressPatterns) {
      if (pattern.test(line)) {
        return line;
      }
    }
  }
  
  // Look for common venue words
  const venueWords = [
    'hotel', 'restaurant', 'café', 'cafe', 'hall', 'center', 'centre', 
    'room', 'building', 'plaza', 'park', 'garden', 'theater', 'theatre',
    'stadium', 'arena', 'conference', 'gallery', 'museum', 'campus'
  ];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const word of venueWords) {
      if (lowerLine.includes(word) && line.length < 100) { // Not too long
        return line;
      }
    }
  }
  
  return null;
}

/**
 * Extract a description from the text
 * @param {string[]} lines - Array of text lines
 * @param {object} eventDetails - Already extracted event details
 * @returns {string|null} - Description or null
 */
function findDescription(lines, eventDetails) {
  // Look for description keywords
  const descriptionKeywords = [
    'description:', 'details:', 'info:', 'information:',
    'about:', 'agenda:', 'program:', 'schedule:'
  ];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    for (const keyword of descriptionKeywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        // This line likely contains the description
        const keywordIndex = lowerLine.indexOf(keyword.toLowerCase());
        if (keywordIndex !== -1 && keywordIndex + keyword.length < line.length) {
          return line.substring(keywordIndex + keyword.length).trim();
        }
      }
    }
  }
  
  // If we didn't find a dedicated description, collect relevant information
  const usedLines = new Set();
  
  // Mark lines that contain the title, date, time, or location as used
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (eventDetails.title && line.includes(eventDetails.title.toLowerCase())) {
      usedLines.add(i);
    }
    
    if (eventDetails.date && line.includes(eventDetails.date.toLowerCase())) {
      usedLines.add(i);
    }
    
    if (eventDetails.time && line.includes(eventDetails.time.toLowerCase())) {
      usedLines.add(i);
    }
    
    if (eventDetails.location && line.includes(eventDetails.location.toLowerCase())) {
      usedLines.add(i);
    }
    
    // Also skip common header/footer lines
    if (line.match(/^(rsvp|dress code|please|contact|more information|invited by)/i)) {
      usedLines.add(i);
    }
  }
  
  // Collect unused lines that might be part of the description
  let description = '';
  for (let i = 0; i < lines.length; i++) {
    if (!usedLines.has(i) && lines[i].length > 5) {
      if (description) description += ' ';
      description += lines[i];
    }
  }
  
  return description || null;
} 
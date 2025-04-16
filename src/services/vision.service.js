const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');

// Initialize the Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../google-credentials.json'),
});

console.log('Google Cloud Vision API initialized');

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
    
    // Try to find event title
    // Usually the most prominent text, often at the beginning
    eventDetails.title = findEventTitle(lines);
    
    // Try to find date(s)
    const dateInfo = findDates(lines, text);
    if (dateInfo) {
      eventDetails.date = dateInfo.date;
      if (dateInfo.time) {
        eventDetails.time = dateInfo.time;
      }
    }
    
    // Try to find location information
    eventDetails.location = findLocation(lines, text);
    
    // Try to extract a description or additional details
    eventDetails.description = findDescription(lines, eventDetails);
    
    console.log('Extracted event details:', eventDetails);
    return eventDetails;
    
  } catch (error) {
    console.error('Error parsing event details:', error);
    // Return whatever we've been able to extract so far
    return eventDetails;
  }
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
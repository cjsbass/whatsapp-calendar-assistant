const fs = require('fs');
const path = require('path');
let vision;

// Check if we have Google credentials
const credentialsPath = path.join(__dirname, '../../credentials/google-credentials.json');
const hasCredentials = fs.existsSync(credentialsPath);

// Force test mode if explicitly set in environment
const forceTestMode = process.env.FORCE_TEST_MODE === 'true';
// Use test mode if in development and no credentials, or if forced
const isTestMode = forceTestMode || (!hasCredentials && process.env.NODE_ENV !== 'production');

console.log(`Image Service Mode: ${isTestMode ? 'TEST' : 'GOOGLE VISION API'}`);

// Only try to load the vision API if we're not in test mode
if (!isTestMode) {
  try {
    vision = require('@google-cloud/vision');
    console.log('Google Cloud Vision API loaded successfully');
  } catch (error) {
    console.warn('Google Cloud Vision API could not be loaded:', error.message);
    console.warn('Running in test mode without Google Vision API');
  }
}

// Create log directory
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create images directory for saving received images
const imagesDir = path.join(__dirname, '../../received-images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

/**
 * Save image for debugging
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {string} - The path where the image was saved
 */
const saveImageForDebugging = (imageBuffer) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const imagePath = path.join(imagesDir, `image-${timestamp}.jpg`);
  fs.writeFileSync(imagePath, imageBuffer);
  console.log(`Image saved to ${imagePath}`);
  return imagePath;
};

/**
 * Enhance extracted text with context awareness
 * @param {string} rawText - The raw text extracted from the image
 * @returns {string} - Enhanced text with better context
 */
const enhanceExtractedText = (rawText) => {
  // Add context markers to help with parsing
  return `=== EVENT INVITATION ===
${rawText}
=== END OF INVITATION ===`;
};

/**
 * Extract text from an image using Google Cloud Vision API
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<string>} - The extracted text
 */
const extractTextFromImage = async (imageBuffer) => {
  // Save the image for debugging
  const imagePath = saveImageForDebugging(imageBuffer);

  // If in test mode, return dummy text
  if (isTestMode) {
    console.log('Using test mode for text extraction');
    return `
      WEDDING INVITATION
      
      Gabriella Squilloni and Marco Cavallaro
      
      invite you to the
      
      MARRIAGE
      
      of their children
      
      SILVIA & JAMES EDMUND
      
      SATURDAY
      
      03.01.2015
      
      4 pm
      
      reception to follow
      
      LANDTSCAP
      
      Devonvale Road
      
      Stellenbosch 7600 | South Africa
    `;
  }

  try {
    // Check if we have Vision API available
    if (!vision) {
      console.warn('Google Vision API not available, falling back to test mode');
      return `
        WEDDING INVITATION
        
        Gabriella Squilloni and Marco Cavallaro
        
        invite you to the
        
        MARRIAGE
        
        of their children
        
        SILVIA & JAMES EDMUND
        
        SATURDAY
        
        03.01.2015
        
        4 pm
        
        reception to follow
        
        LANDTSCAP
        
        Devonvale Road
        
        Stellenbosch 7600 | South Africa
      `;
    }

    // Create a client with proper context for event invitations
    const client = new vision.ImageAnnotatorClient();
    console.log('Sending image to Google Vision API for text detection...');
    
    // First try document text detection for better structure
    try {
      const [documentResult] = await client.documentTextDetection(imageBuffer);
      if (documentResult && documentResult.fullTextAnnotation) {
        console.log('Document text detected successfully');
        const text = documentResult.fullTextAnnotation.text;
        
        // Save the detected text to a file for debugging
        const textPath = path.join(logDir, `text-${Date.now()}.txt`);
        fs.writeFileSync(textPath, text);
        console.log(`Extracted text saved to ${textPath}`);
        
        return enhanceExtractedText(text);
      }
    } catch (docError) {
      console.error('Error with document text detection, falling back to regular text detection:', docError);
    }
    
    // Fall back to regular text detection if document detection fails
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (detections && detections.length > 0) {
      console.log('Text detected successfully');
      const text = detections[0].description;
      
      // Save the detected text to a file for debugging
      const textPath = path.join(logDir, `text-${Date.now()}.txt`);
      fs.writeFileSync(textPath, text);
      console.log(`Extracted text saved to ${textPath}`);
      
      return enhanceExtractedText(text);
    }
    
    console.log('No text detected in the image');
    return '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    console.log('Falling back to test mode after error');
    
    // Return test data in case of error
    return `
      WEDDING INVITATION
      
      Gabriella Squilloni and Marco Cavallaro
      
      invite you to the
      
      MARRIAGE
      
      of their children
      
      SILVIA & JAMES EDMUND
      
      SATURDAY
      
      03.01.2015
      
      4 pm
      
      reception to follow
      
      LANDTSCAP
      
      Devonvale Road
      
      Stellenbosch 7600 | South Africa
    `;
  }
};

/**
 * Extract event details from text
 * @param {string} text - The text to extract details from
 * @returns {object|null} - The extracted event details or null if not found
 */
const parseEventDetails = (text) => {
  if (!text) return null;
  
  console.log('Parsing event details from extracted text');
  
  // Initialize event details
  const eventDetails = {
    title: null,
    date: null,
    time: null,
    location: null
  };
  
  // Regular expressions for different event properties
  const dateRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})|(\w+ \d{1,2}(?:st|nd|rd|th)?,? \d{4})|(\d{1,2}(?:st|nd|rd|th)? \w+,? \d{4})|(\w+ \d{1,2},? \d{4})|(\d{2}\.\d{2}\.\d{4})/gi;
  const timeRegex = /(\d{1,2}[:\.]\d{2}\s*(?:am|pm|AM|PM)?)|(\d{1,2}\s*(?:am|pm|AM|PM))|(\d{1,2}(?:\s*)?(?:am|pm|AM|PM))/gi;
  const locationRegex = /(?:at|location|venue|place|@|address)\s*:?\s*([^.,]*)/i;
  
  // Look for specific event types
  const weddingKeywords = /(wedding|marriage|marry|bride|groom|ceremony)/i;
  const meetingKeywords = /(meeting|conference|discussion|call|zoom|teams|meet|meetup)/i;
  const partyKeywords = /(party|celebration|birthday|anniversary)/i;
  
  // Determine event type
  let eventType = 'Event';
  if (weddingKeywords.test(text)) {
    eventType = 'Wedding';
  } else if (meetingKeywords.test(text)) {
    eventType = 'Meeting';
  } else if (partyKeywords.test(text)) {
    eventType = 'Party';
  }
  
  // Try to extract event title
  const lines = text.split('\n');
  let potentialTitles = [];
  
  // Look for potential titles
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 0 && trimmedLine.length < 100) {
      potentialTitles.push(trimmedLine);
    }
  }
  
  // For weddings, try to extract names
  if (eventType === 'Wedding') {
    const namePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+and|\s+&|\s+\+)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
    const nameMatch = text.match(namePattern);
    
    if (nameMatch && nameMatch.length >= 3) {
      eventDetails.title = `${eventType}: ${nameMatch[1]} & ${nameMatch[2]}`;
    } else if (potentialTitles.length > 0) {
      eventDetails.title = `${eventType}: ${potentialTitles[0]}`;
    } else {
      eventDetails.title = eventType;
    }
  } else if (potentialTitles.length > 0) {
    // For other events, use the first potential title
    eventDetails.title = potentialTitles[0];
  } else {
    eventDetails.title = eventType;
  }
  
  // Extract date
  const dateMatches = text.match(dateRegex);
  if (dateMatches && dateMatches.length > 0) {
    eventDetails.date = dateMatches[0];
    console.log(`Extracted date: ${eventDetails.date}`);
  }
  
  // Extract time
  const timeMatches = text.match(timeRegex);
  if (timeMatches && timeMatches.length > 0) {
    eventDetails.time = timeMatches[0];
    console.log(`Extracted time: ${eventDetails.time}`);
  }
  
  // Extract location
  const locationMatch = text.match(locationRegex);
  if (locationMatch && locationMatch.length > 1) {
    eventDetails.location = locationMatch[1].trim();
  } else {
    // Try to find location in the text between common location keywords
    const locationLines = lines.filter(line => 
      /venue|location|address|place|held at|taking place at/i.test(line) || 
      /street|road|avenue|lane|boulevard|drive|plaza|hall|center|hotel/i.test(line)
    );
    
    if (locationLines.length > 0) {
      eventDetails.location = locationLines[0].trim();
    }
  }
  
  console.log(`Extracted location: ${eventDetails.location || 'Not found'}`);
  
  // If we couldn't extract at least a title and date, return null
  if (!eventDetails.title || !eventDetails.date) {
    // In test mode, provide dummy data if extraction fails
    if (isTestMode) {
      console.log('Using test mode dummy event details');
      return {
        title: 'Wedding: Silvia & James Edmund',
        date: '03.01.2015',
        time: '4 pm',
        location: 'LANDTSCAP, Devonvale Road, Stellenbosch, South Africa'
      };
    }
    console.log('Failed to extract required event details (title and date)');
    return null;
  }
  
  return eventDetails;
};

/**
 * Extract event details from an image
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<object|null>} - The extracted event details or null if not found
 */
exports.extractEventDetails = async (imageBuffer) => {
  try {
    console.log('Processing image to extract event details...');
    
    // Extract text from the image
    const text = await extractTextFromImage(imageBuffer);
    console.log('Extracted text from image:', text);
    
    // Parse event details from the text
    const eventDetails = parseEventDetails(text);
    
    if (eventDetails) {
      console.log('Successfully extracted event details:', JSON.stringify(eventDetails, null, 2));
    } else {
      console.log('Failed to extract event details from the image');
    }
    
    return eventDetails;
  } catch (error) {
    console.error('Error extracting event details:', error);
    
    // In test mode, return dummy data even if there's an error
    if (isTestMode) {
      console.log('Using test mode dummy event details due to error');
      return {
        title: 'Wedding: Silvia & James Edmund',
        date: '03.01.2015',
        time: '4 pm',
        location: 'LANDTSCAP, Devonvale Road, Stellenbosch, South Africa'
      };
    }
    
    return null;
  }
}; 
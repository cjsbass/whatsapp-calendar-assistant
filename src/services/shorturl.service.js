const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Directory to store URL mappings
const urlsDir = path.join(__dirname, '../../url-mappings');
if (!fs.existsSync(urlsDir)) {
  fs.mkdirSync(urlsDir, { recursive: true });
}

// File to store URL mappings
const urlMappingsFile = path.join(urlsDir, 'url-mappings.json');

// Initialize or load URL mappings
let urlMappings = {};
if (fs.existsSync(urlMappingsFile)) {
  try {
    const data = fs.readFileSync(urlMappingsFile, 'utf8');
    urlMappings = JSON.parse(data);
    console.log(`Loaded ${Object.keys(urlMappings).length} URL mappings from file`);
  } catch (error) {
    console.error('Error loading URL mappings:', error);
    // Initialize with empty object if there's an error
    urlMappings = {};
  }
} else {
  // Create empty mapping file
  fs.writeFileSync(urlMappingsFile, JSON.stringify({}), 'utf8');
  console.log('Created new URL mappings file');
}

/**
 * Generate a short URL for a long URL
 * @param {string} longUrl - The URL to shorten
 * @returns {string} - The short URL ID
 */
function generateShortUrl(longUrl) {
  // Check if we already have a mapping for this URL
  for (const [shortId, url] of Object.entries(urlMappings)) {
    if (url === longUrl) {
      console.log(`Using existing short URL for ${longUrl.substring(0, 50)}...`);
      return shortId;
    }
  }
  
  // Generate a short unique ID (6 characters should be enough for our use case)
  const shortId = crypto.randomBytes(3).toString('hex');
  
  // Store the mapping
  urlMappings[shortId] = longUrl;
  
  // Save to file
  fs.writeFileSync(urlMappingsFile, JSON.stringify(urlMappings, null, 2), 'utf8');
  
  console.log(`Created short URL ${shortId} for ${longUrl.substring(0, 50)}...`);
  return shortId;
}

/**
 * Get the long URL for a short URL ID
 * @param {string} shortId - The short URL ID
 * @returns {string|null} - The original long URL or null if not found
 */
function getLongUrl(shortId) {
  return urlMappings[shortId] || null;
}

/**
 * Create short URLs for calendar links
 * @param {object} calendarLinks - Object with calendar links for different services
 * @returns {object} - Object with shortened URLs for each service
 */
function shortenCalendarLinks(calendarLinks) {
  const shortenedLinks = {};
  
  // Base URL for redirect (should match your deployment URL)
  const baseUrl = process.env.BASE_URL || 'https://apt-reindeer-quickly.ngrok-free.app';
  
  // Shorten each calendar link
  for (const [service, url] of Object.entries(calendarLinks)) {
    if (service === 'all') continue; // Skip the 'all' entry
    
    const shortId = generateShortUrl(url);
    shortenedLinks[service] = `${baseUrl}/r/${shortId}`;
  }
  
  // Set the 'all' value to the Google Calendar link by default
  shortenedLinks.all = shortenedLinks.google;
  
  return shortenedLinks;
}

module.exports = {
  generateShortUrl,
  getLongUrl,
  shortenCalendarLinks
}; 
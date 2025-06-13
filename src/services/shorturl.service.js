const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// In-memory URL mappings (serverless-friendly)
// For production, this could be replaced with a database
let urlMappings = {};
console.log('Initialized in-memory URL mappings for serverless environment');

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
  
  // Store the mapping in memory
  urlMappings[shortId] = longUrl;
  
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
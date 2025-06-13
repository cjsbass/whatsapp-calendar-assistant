const fs = require('fs');
const path = require('path');

// For serverless environment, we don't create directories or save files
console.log('Image Service Mode: SERVERLESS - processing in memory only');

/**
 * Extract event details from an image (serverless version - uses vision.service.js)
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<object|null>} - The extracted event details or null if not found
 */
exports.extractEventDetails = async (imageBuffer) => {
  try {
    console.log(`Processing image in memory (${imageBuffer.length} bytes)`);
    
    // Import vision service (which handles the actual Vision API calls)
    const visionService = require('./vision.service');
    
    // Use the vision service to extract event details
    const eventDetails = await visionService.extractEventDetails(imageBuffer);
    
    if (eventDetails) {
      console.log('Successfully extracted event details:', JSON.stringify(eventDetails, null, 2));
    } else {
      console.log('Failed to extract event details from the image');
    }
    
    return eventDetails;
  } catch (error) {
    console.error('Error extracting event details:', error);
    return null;
  }
}; 
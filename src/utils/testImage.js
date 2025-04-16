// This utility script helps to test the image processing functionality locally

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const imageService = require('../services/image.service');
const calendarService = require('../services/calendar.service');

// Path to a sample image for testing
// Replace with an actual path to an image on your system
const sampleImagePath = path.join(__dirname, '../../test-images/sample-event.jpg');

async function testImageProcessing() {
  try {
    console.log('Reading sample image...');
    // Check if the image exists
    if (!fs.existsSync(sampleImagePath)) {
      console.error('Sample image not found. Please place a test image at:', sampleImagePath);
      console.log('Creating test-images directory...');
      fs.mkdirSync(path.join(__dirname, '../../test-images'), { recursive: true });
      return;
    }

    // Read the image
    const imageBuffer = fs.readFileSync(sampleImagePath);
    
    console.log('Extracting event details from image...');
    const eventDetails = await imageService.extractEventDetails(imageBuffer);
    
    if (eventDetails) {
      console.log('Extracted event details:');
      console.log(JSON.stringify(eventDetails, null, 2));
      
      console.log('\nCreating calendar event...');
      const event = await calendarService.createEvent(eventDetails);
      
      console.log('Calendar event created:');
      console.log(JSON.stringify(event, null, 2));
    } else {
      console.log('No event details could be extracted from the image.');
    }
  } catch (error) {
    console.error('Error testing image processing:', error);
  }
}

// Run the test
testImageProcessing(); 
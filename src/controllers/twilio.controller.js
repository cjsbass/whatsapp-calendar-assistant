/**
 * Twilio WhatsApp Controller
 * Handles incoming webhook requests from Twilio WhatsApp API
 */
const fs = require('fs');
const path = require('path');
const twilioService = require('../services/twilio.service');
const calendarService = require('../services/calendar.service');
const visionService = require('../services/vision.service');
const shortUrlService = require('../services/shorturl.service');
const axios = require('axios');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFile = path.join(logsDir, 'twilio-events.log');

// Helper function to log webhook events
const logWebhookEvent = (event) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${JSON.stringify(event, null, 2)}\n\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(`Twilio webhook event logged to ${logFile}`);
};

/**
 * Handle incoming webhook messages from Twilio
 */
exports.receiveMessage = async (req, res) => {
  console.log('Twilio webhook received at:', new Date().toISOString());
  
  // Log the webhook payload
  logWebhookEvent(req.body);
  
  try {
    // Check if this is a valid Twilio webhook
    if (!req.body.From) {
      console.log('Invalid webhook - missing From field');
      return res.status(200).send('Invalid webhook payload');
    }
    
    // Extract message info from Twilio webhook
    const messageType = req.body.MediaContentType0 ? 'media' : 'text';
    const senderPhone = req.body.From.replace('whatsapp:', ''); // Remove the 'whatsapp:' prefix
    const messageBody = req.body.Body || '';
    
    console.log(`Received ${messageType} message from ${senderPhone}`);
    
    // Check if this is a media (image) message
    if (messageType === 'media' && req.body.MediaUrl0) {
      console.log('Processing image message...');
      const mediaUrl = req.body.MediaUrl0;
      
      try {
        // Download the image
        console.log(`Downloading image from URL: ${mediaUrl}`);
        const imageResponse = await axios.get(mediaUrl, { 
          responseType: 'arraybuffer',
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
          }
        });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        
        if (!imageBuffer) {
          console.error('Failed to download image');
          try {
            await twilioService.sendTextMessage(
              senderPhone, 
              '❌ Sorry, I encountered an error while downloading your image. Please try again later.'
            );
          } catch (twilioError) {
            console.log('⚠️ Twilio send failed (expected during pending approval):', twilioError.message);
          }
          return res.sendStatus(200); // Acknowledge receipt
        }
        
        // Extract event details from image
        console.log('Extracting event details from image...');
        const eventDetails = await visionService.extractEventDetails(imageBuffer);
        
        console.log('Extracted event details:', JSON.stringify(eventDetails));
        
        if (!eventDetails || !eventDetails.title || !eventDetails.date) {
          console.log('Failed to extract valid event details');
          try {
            await twilioService.sendTextMessage(
              senderPhone, 
              '❌ Sorry, I couldn\'t extract event details from your image. Please make sure the image contains clear information about the event.'
            );
          } catch (twilioError) {
            console.log('⚠️ Twilio send failed (expected during pending approval):', twilioError.message);
          }
          return res.sendStatus(200);
        }
        
        // Generate calendar links
        console.log('Generating calendar links...');
        const calendarLinks = await calendarService.generateCalendarLink(eventDetails);

        // Check if the Google link was generated
        if (!calendarLinks || !calendarLinks.google) {
          console.error('Failed to generate Google calendar link');
          try {
            await twilioService.sendTextMessage(
              senderPhone,
              '❌ Sorry, I encountered an error while creating the Google Calendar link. Please try again later.'
            );
          } catch (twilioError) {
            console.log('⚠️ Twilio send failed (expected during pending approval):', twilioError.message);
          }
          return res.sendStatus(200);
        }

        console.log(`Google Calendar link generated successfully: ${calendarLinks.google}`);

        // Send only the direct Google Calendar link
        const googleLink = calendarLinks.google;
        console.log('Sending direct Google Calendar link...');
        try {
          await twilioService.sendTextMessage(
            senderPhone,
            `✅ Event detected: "${eventDetails.title}"\n\nTap to add to your calendar:\n${googleLink}`
          );
          console.log('Successfully processed image and sent direct Google Calendar link');
        } catch (twilioError) {
          console.log('⚠️ Twilio send failed (expected during pending approval):', twilioError.message);
          console.log('✅ Event processed successfully, but message not sent due to pending approval');
        }
      } catch (error) {
        console.error('Error processing image message:', error);
        try {
          await twilioService.sendTextMessage(
            senderPhone, 
            '❌ Sorry, I encountered an error while processing your image. Please try again later.'
          );
        } catch (twilioError) {
          console.log('⚠️ Twilio send failed (expected during pending approval):', twilioError.message);
        }
      }
    } else {
      // Handle text messages
      console.log('Processing text message:', messageBody);
      
      const helpMessage = 
        '👋 Hello! I\'m your WhatsApp Calendar Assistant.\n\n' +
        'Send me a screenshot of an event invitation, and I\'ll extract the details and create a calendar event for you.\n\n' +
        'I\'ll create a link that you can tap to add the event directly to your calendar!';
      
      try {
        await twilioService.sendTextMessage(senderPhone, helpMessage);
        console.log('✅ Help message sent successfully');
      } catch (twilioError) {
        console.log('⚠️ Twilio send failed (expected during pending approval):', twilioError.message);
        // Don't throw error - this is expected when WhatsApp is pending approval
      }
    }
    
    // Send 200 OK to acknowledge the webhook receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in Twilio webhook handler:', error);
    res.status(200).send('Error processing message, but received');
  }
}; 
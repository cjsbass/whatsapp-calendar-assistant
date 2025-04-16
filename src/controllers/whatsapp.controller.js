const fs = require('fs');
const path = require('path');
const util = require('util');
const whatsappService = require('../services/whatsapp.service');
const calendarService = require('../services/calendar.service');
const visionService = require('../services/vision.service');
const shortUrlService = require('../services/shorturl.service');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFile = path.join(logsDir, 'webhook-events.log');

// Helper function to log webhook events
const logWebhookEvent = (event) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${JSON.stringify(event, null, 2)}\n\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(`Webhook event logged to ${logFile}`);
  console.log(logEntry);
};

/**
 * Verify the webhook callback URL
 */
exports.verifyWebhook = (req, res) => {
  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Log verification attempt
  console.log('Webhook verification request received');
  console.log(`Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
  }

  // Respond with '403 Forbidden' if verify tokens do not match
  console.log('Webhook verification failed');
  return res.sendStatus(403);
};

/**
 * Handle incoming webhook messages
 */
exports.receiveMessage = async (req, res) => {
  console.log('Webhook event received:', req.body);
  
  // Always respond with 200 OK to all webhook events
  // (WhatsApp requires this to acknowledge receipt)
  res.status(200).send('OK');
  
  try {
    // Check if this is a WhatsApp message event
    if (!req.body || !req.body.entry || !req.body.entry[0] || !req.body.entry[0].changes) {
      console.log('Not a WhatsApp message event, ignoring');
      return;
    }
    
    const changes = req.body.entry[0].changes;
    
    if (!changes[0] || !changes[0].value || !changes[0].value.messages) {
      console.log('No messages in the webhook event, ignoring');
      return;
    }
    
    const messages = changes[0].value.messages;
    const senderPhone = changes[0].value.contacts?.[0]?.wa_id;
    
    console.log(`Processing ${messages.length} messages from ${senderPhone}`);
    
    for (const message of messages) {
      // Check if this is an image message
      if (message.type === 'image') {
        console.log('Received image message, processing...');
        const imageId = message.image.id;
        
        try {
          // Fetch media URL
          console.log(`Fetching media URL for ID: ${imageId}`);
          const mediaUrl = await whatsappService.getMediaUrl(imageId);
          
          if (!mediaUrl) {
            console.error('Failed to get media URL');
            await whatsappService.sendTextMessage(
              senderPhone, 
              '❌ Sorry, I encountered an error while processing your image. Please try again later.'
            );
            continue;
          }
          
          // Download the image
          console.log(`Downloading image from URL: ${mediaUrl}`);
          const imageBuffer = await whatsappService.downloadMedia(mediaUrl);
          
          if (!imageBuffer) {
            console.error('Failed to download image');
            await whatsappService.sendTextMessage(
              senderPhone, 
              '❌ Sorry, I encountered an error while downloading your image. Please try again later.'
            );
            continue;
          }
          
          // Extract event details from image
          console.log('Extracting event details from image...');
          const eventDetails = await visionService.extractEventDetails(imageBuffer);
          
          console.log('Extracted event details:', JSON.stringify(eventDetails));
          
          if (!eventDetails || !eventDetails.title || !eventDetails.date) {
            console.log('Failed to extract valid event details');
            await whatsappService.sendTextMessage(
              senderPhone, 
              '❌ Sorry, I couldn\'t extract event details from your image. Please make sure the image contains clear information about the event.'
            );
            continue;
          }
          
          // Generate calendar links
          console.log('Generating calendar links...');
          const calendarLinks = calendarService.generateCalendarLink(eventDetails);
          
          // Shorten the calendar links
          console.log('Shortening calendar links...');
          const shortLinks = shortUrlService.shortenCalendarLinks(calendarLinks);
          
          // Create a readable event summary
          let eventSummary = `🎉 *${eventDetails.title}*\n\n`;
          
          if (eventDetails.date) {
            eventSummary += `📅 Date: ${eventDetails.date}\n`;
          }
          
          if (eventDetails.time) {
            eventSummary += `⏰ Time: ${eventDetails.time}\n`;
          }
          
          if (eventDetails.location) {
            eventSummary += `📍 Location: ${eventDetails.location}\n`;
          }
          
          if (eventDetails.description) {
            eventSummary += `📝 Description: ${eventDetails.description}\n`;
          }
          
          eventSummary += `\n📱 *Add to Calendar:*\n`;
          eventSummary += `• [Google Calendar](${shortLinks.google})\n`;
          eventSummary += `• [Outlook](${shortLinks.outlook})\n`;
          eventSummary += `• [Yahoo Calendar](${shortLinks.yahoo})\n`;
          
          // Send response with event details and shortened calendar links
          console.log('Sending response with shortened calendar links...');
          await whatsappService.sendTextMessage(senderPhone, eventSummary);
          
          console.log('Successfully processed image and sent calendar links');
        } catch (error) {
          console.error('Error processing image message:', error);
          await whatsappService.sendTextMessage(
            senderPhone, 
            '❌ Sorry, I encountered an error while processing your image. Please try again later.'
          );
        }
      } else if (message.type === 'text') {
        // Handle text messages
        console.log('Received text message, sending help response...');
        
        const helpMessage = 
          '👋 Hello! I\'m your WhatsApp Calendar Assistant.\n\n' +
          'Send me a screenshot of an event invitation, and I\'ll extract the details and create a calendar event for you.\n\n' +
          'I\'ll provide you with links to add the event directly to your preferred calendar app!';
        
        await whatsappService.sendTextMessage(senderPhone, helpMessage);
      }
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
  }
}; 
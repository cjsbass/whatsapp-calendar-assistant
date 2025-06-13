// Simplified WhatsApp Calendar Assistant with Twilio - Text Only Version
require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio sends form data

// Twilio WhatsApp webhook endpoint
app.post('/api/webhook', async (req, res) => {
  console.log('=== TWILIO WHATSAPP WEBHOOK ===');
  console.log('From:', req.body.From);
  console.log('To:', req.body.To);
  console.log('Body text:', req.body.Body);
  console.log('Media count:', req.body.NumMedia || 0);
  
  // Always respond quickly to Twilio
  res.status(200).send('OK');
  
  try {
    const fromNumber = req.body.From; // e.g., "whatsapp:+1234567890"
    const messageBody = req.body.Body;
    const numMedia = parseInt(req.body.NumMedia) || 0;
    
    // Handle image messages (placeholder for now)
    if (numMedia > 0) {
      console.log('Image message received - processing not yet implemented');
      
      await twilioClient.messages.create({
        body: "📸 Image received! Image processing is being set up. For now, please describe your event and I'll help you create a calendar link.",
        from: req.body.To,
        to: fromNumber
      });
      
    } else if (messageBody) {
      // Handle text messages
      const lowerMessage = messageBody.toLowerCase();
      
      if (lowerMessage.includes('test') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        const helpMessage = 
          '👋 Hello! I\'m your WhatsApp Calendar Assistant.\n\n' +
          '📸 Send me a screenshot of an event invitation, and I\'ll extract the details and create a calendar link for you!\n\n' +
          '✨ I can process:\n' +
          '• Wedding invitations\n' +
          '• Event flyers\n' +
          '• Meeting screenshots\n' +
          '• Any image with event details\n\n' +
          '🔧 Currently setting up image processing...\n' +
          'Reply with "test" to see this message again.';
        
        await twilioClient.messages.create({
          body: helpMessage,
          from: req.body.To,
          to: fromNumber
        });
      } else {
        // Echo back their message to confirm it's working
        await twilioClient.messages.create({
          body: `✅ Message received: "${messageBody}"\n\nSend "test" for help or send an image of an event invitation!`,
          from: req.body.To,
          to: fromNumber
        });
      }
    }
    
  } catch (error) {
    console.error('Error in webhook handler:', error);
    
    // Try to send error message if possible
    try {
      await twilioClient.messages.create({
        body: "❌ Sorry, I encountered an error. Please try again later.",
        from: req.body.To,
        to: req.body.From
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
  
  console.log('=== END WEBHOOK ===');
});

// GET endpoint for basic webhook verification
app.get('/api/webhook', (req, res) => {
  console.log('GET webhook verification request');
  res.status(200).send('Twilio WhatsApp Calendar Assistant webhook is ready (Text version)');
});

// Default route
app.get('/', (req, res) => {
  res.send('WhatsApp Calendar Assistant is running! (Text version - Image processing coming soon)');
});

// Only start server if running locally
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app; 
// Kairos - v6.0 - MessageBird Integration
const axios = require('axios');

console.log('🆕 KAIROS v6.0 - MessageBird Integration');

// Initialize Google Cloud Vision client
let visionClient;
try {
  const vision = require('@google-cloud/vision');
  if (process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
    visionClient = new vision.ImageAnnotatorClient({
      credentials: {
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
    console.log('✅ Vision API initialized v6.0');
  }
} catch (error) {
  console.error('❌ Vision API Init Error:', error.message);
}

// MAIN HANDLER
module.exports = async (req, res) => {
  console.log('🔥 v6.0 MessageBird HANDLER CALLED');

  // Handle GET requests for health checks
  if (req.method === 'GET') {
    return res.status(200).send('✅ Kairos v6.0 (MessageBird) is running!');
  }

  // Handle POST requests (MessageBird webhook)
  if (req.method === 'POST') {
    console.log('✅ v6.0 MessageBird POST request received. Parsing body...');

    // MessageBird sends JSON payload
    let parsedPayload = req.body;
    if (!parsedPayload || Object.keys(parsedPayload).length === 0) {
      // Fallback manual parsing if needed
      parsedPayload = await new Promise((resolve, reject) => {
        try {
          let data = '';
          req.on('data', chunk => { data += chunk; });
          req.on('end', () => resolve(JSON.parse(data)));
        } catch (err) {
          reject(err);
        }
      });
    }

    console.log('📥 MessageBird payload:', JSON.stringify(parsedPayload, null, 2));

    // Respond immediately to MessageBird
    res.status(200).json({ status: 'received' });

    // Process the webhook payload asynchronously
    processMessageBirdWebhook(parsedPayload).catch(error => {
      console.error('❌ v6.0 Unhandled error in processMessageBirdWebhook:', error);
    });
    return;
  }
  
  return res.status(405).send('Method Not Allowed');
};

// Asynchronous MessageBird webhook processing
async function processMessageBirdWebhook(payload) {
  try {
    // MessageBird webhook structure
    if (payload.type === 'message.received') {
      const message = payload.message;
      const from = message.from;
      const conversationId = payload.conversation?.id;
      
      console.log(`📱 v6.0 Message from ${from}, conversation: ${conversationId}`);

      if (message.type === 'image') {
        console.log('🖼️ v6.0 Image message detected');
        await handleMessageBirdImageMessage(from, conversationId, message);
      } else if (message.type === 'text') {
        console.log('📝 v6.0 Text message received:', message.content.text);
        await handleMessageBirdTextMessage(from, conversationId, message.content.text);
      }
    }
  } catch (error) {
    console.error(`❌ v6.0 Error processing MessageBird webhook:`, error);
  }
}

// Handle MessageBird Image Messages
async function handleMessageBirdImageMessage(from, conversationId, message) {
  await sendMessageBirdMessage(from, conversationId, 'Got your invitation! 📸 Analyzing the image now...');

  try {
    const imageUrl = message.content.image.url;
    const imageBuffer = await downloadImageFromMessageBird(imageUrl);
    const text = await extractTextFromImage(imageBuffer);

    if (!text) {
      await sendMessageBirdMessage(from, conversationId, 'I couldn\'t read any text from that image. Please try a clearer picture.');
      return;
    }

    console.log(`📄 Extracted Text (v6.0): \n---\n${text}\n---`);
    const eventDetails = parseWeddingText(text);

    if (eventDetails.date && eventDetails.time) {
      const calendarUrl = createGoogleCalendarUrl(eventDetails);
      const successMessage = `🎉 Success!\n\n*Event*: ${eventDetails.title}\n*Date*: ${eventDetails.date}\n*Time*: ${eventDetails.time}\n*Location*: ${eventDetails.location || 'Not found'}\n\n*Calendar Link*: ${calendarUrl}`;
      await sendMessageBirdMessage(from, conversationId, successMessage);
    } else {
      await sendMessageBirdMessage(from, conversationId, `I found some text, but couldn't figure out the full event details. I saw:\n\n_"${text.substring(0, 100)}..."_`);
    }
  } catch (error) {
    console.error('❌ v6.0 Error processing image:', error);
    await sendMessageBirdMessage(from, conversationId, '😕 Sorry, an error occurred while processing your image.');
  }
}

// Handle MessageBird Text Messages
async function handleMessageBirdTextMessage(from, conversationId, text) {
  const welcomeMessage = `Hello! I'm Kairos, your AI-powered calendar assistant. 🗓️\n\nSend me a clear picture of a wedding or event invitation, and I'll create a calendar link for you.`;
  await sendMessageBirdMessage(from, conversationId, welcomeMessage);
}

// --- MESSAGEBIRD HELPER FUNCTIONS ---

async function sendMessageBirdMessage(to, conversationId, text) {
  if (!process.env.MESSAGEBIRD_API_KEY) {
    console.error('❌ v6.0 MessageBird API key not configured');
    return;
  }

  try {
    console.log(`📤 v6.0 Sending MessageBird message to ${to}`);
    
    const response = await axios.post(
      'https://conversations.messagebird.com/v1/conversations/' + conversationId + '/messages',
      {
        type: 'text',
        content: {
          text: text
        }
      },
      {
        headers: {
          'Authorization': `AccessKey ${process.env.MESSAGEBIRD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ v6.0 MessageBird message sent, ID: ${response.data.id}`);
  } catch (error) {
    console.error(`❌ v6.0 Failed to send MessageBird message:`, error.response?.data || error.message);
  }
}

async function downloadImageFromMessageBird(url) {
  console.log('📥 v6.0 Downloading image from MessageBird...');
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: {
      'Authorization': `AccessKey ${process.env.MESSAGEBIRD_API_KEY}`
    }
  });
  
  console.log('✅ v6.0 Image downloaded from MessageBird');
  return Buffer.from(response.data);
}

// --- EXISTING HELPER FUNCTIONS (unchanged) ---

async function extractTextFromImage(imageBuffer) {
  if (!visionClient) {
    console.error('❌ v6.0 Vision client not initialized.');
    return null;
  }
  console.log('🔍 v6.0 Extracting text with Vision API...');
  const [result] = await visionClient.textDetection(imageBuffer);
  const text = result.fullTextAnnotation?.text;
  console.log('✅ v6.0 Text extracted.');
  return text;
}

function parseWeddingText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const details = { title: 'Wedding Celebration', date: null, time: null, location: null };

  // Find Names
  const nameLineIndex = lines.findIndex(line => line.match(/to/i));
  if (nameLineIndex > 0) {
    details.title = `Wedding: ${lines[nameLineIndex - 1]} & ${lines[nameLineIndex + 1]}`;
  }
  
  // Find Date (e.g., "29TH DECEMBER 2022")
  const dateLine = lines.find(line => line.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i));
  if (dateLine) {
    details.date = dateLine.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i)[0];
  }

  // Find Time (e.g., "4.30PM")
  const timeLine = lines.find(line => line.match(/\d{1,2}[\.:]\d{2}\s*(?:pm|am)/i));
  if (timeLine) {
    details.time = timeLine.match(/\d{1,2}[\.:]\d{2}\s*(?:pm|am)/i)[0];
  }
  
  // Find Location (e.g., "FLEUR DU CAP")
  const locationLine = lines.find(line => line.match(/fleur du cap/i));
  if (locationLine) {
    details.location = 'Fleur du Cap, Somerset West';
  }

  return details;
}

function createGoogleCalendarUrl(details) {
  // Clean up date and time for parsing
  const cleanDate = details.date.replace(/(st|nd|rd|th)/i, '');
  const cleanTime = details.time.replace(/\./g, ':');
  
  try {
    const startDateTime = new Date(`${cleanDate} ${cleanTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

    const formatDate = (date) => date.toISOString().replace(/[-:.]/g, '').slice(0, -3) + 'Z';
  
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', details.title);
    url.searchParams.append('dates', `${formatDate(startDateTime)}/${formatDate(endDateTime)}`);
    url.searchParams.append('location', details.location);
    url.searchParams.append('details', 'Event details extracted by Kairos AI calendar assistant.');
  
    return url.toString();
  } catch(e) {
    console.error('❌ Could not parse date/time:', e);
    return 'Could not generate calendar link.';
  }
} 
// A basic script to test WhatsApp media upload functionality
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Set the API URL and token from environment
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!WHATSAPP_TOKEN) {
  console.error('Error: WHATSAPP_API_TOKEN not set in .env file');
  process.exit(1);
}

if (!PHONE_NUMBER_ID) {
  console.error('Error: WHATSAPP_PHONE_NUMBER_ID not set in .env file');
  process.exit(1);
}

// Find the latest iCal file
const icalDir = path.join(__dirname, 'ical-files');
if (!fs.existsSync(icalDir)) {
  console.error(`Error: iCal directory ${icalDir} not found`);
  process.exit(1);
}

const icalFiles = fs.readdirSync(icalDir).filter(file => file.endsWith('.ics'));
if (icalFiles.length === 0) {
  console.error('Error: No iCal files found in directory');
  process.exit(1);
}

// Sort by creation time (newest first)
icalFiles.sort((a, b) => {
  return fs.statSync(path.join(icalDir, b)).mtime.getTime() - 
         fs.statSync(path.join(icalDir, a)).mtime.getTime();
});

const latestFile = path.join(icalDir, icalFiles[0]);
console.log(`Using latest iCal file: ${latestFile}`);
console.log(`File size: ${fs.statSync(latestFile).size} bytes`);

// Create a temporary text file with the iCal content
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const tempFilePath = path.join(tempDir, 'event.txt');
const icalContent = fs.readFileSync(latestFile, 'utf8');
fs.writeFileSync(tempFilePath, icalContent);
console.log(`Created temporary text file: ${tempFilePath}`);

async function uploadMedia() {
  try {
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath));
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'text/plain');
    
    console.log('Uploading file to WhatsApp Media API...');
    
    // Upload the file
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/media`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        ...form.getHeaders()
      },
      data: form,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('Upload response:', JSON.stringify(response.data, null, 2));
    
    if (!response.data || !response.data.id) {
      console.error('Error: Invalid response from WhatsApp API');
      process.exit(1);
    }
    
    const mediaId = response.data.id;
    console.log(`Media uploaded successfully, ID: ${mediaId}`);
    
    return mediaId;
  } catch (error) {
    console.error('Error uploading media:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function sendDocumentMessage(mediaId) {
  try {
    console.log(`Sending document message with media ID: ${mediaId}`);
    
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '393485704725', // The recipient number
        type: 'document',
        document: {
          id: mediaId,
          caption: 'Calendar Event (Test)',
          filename: 'event.ics' // We still call it .ics so the recipient knows it's a calendar file
        }
      }
    });
    
    console.log('Message sent successfully:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Run the test
async function main() {
  try {
    const mediaId = await uploadMedia();
    const messageResult = await sendDocumentMessage(mediaId);
    console.log('Test completed successfully!');
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    console.log(`Temporary file deleted: ${tempFilePath}`);
    
    return messageResult;
  } catch (error) {
    console.error('Test failed:', error.message);
    
    // Clean up temp file even if there's an error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Temporary file deleted: ${tempFilePath}`);
    }
  }
}

main(); 
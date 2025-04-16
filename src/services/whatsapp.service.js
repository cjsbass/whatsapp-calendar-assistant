const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const FormData = require('form-data');

// WhatsApp API base URL
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Format event details for WhatsApp message
 * @param {object} eventDetails - Event details to format
 * @returns {string} - Formatted message text
 */
const formatEventMessage = (eventDetails) => {
  // Format date if available
  let formattedDate = eventDetails.date || 'Date not specified';
  
  // Format time if available
  let formattedTime = eventDetails.time || 'Time not specified';
  
  // Format location if available
  let formattedLocation = eventDetails.location || 'Location not specified';

  return `✅ *Event created:*\n\n🗓️ *${eventDetails.title}*\n📅 Date: ${formattedDate}\n🕒 Time: ${formattedTime}\n📍 Location: ${formattedLocation}\n\nThis event has been added to your calendar. Check the attached file to add it to your calendar app.`;
};

/**
 * Get the URL for downloading media
 * @param {string} mediaId - The ID of the media to download
 * @returns {Promise<string>} - The URL to download the media
 */
exports.getMediaUrl = async (mediaId) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${WHATSAPP_API_URL}/${mediaId}`,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiToken}`
      }
    });
    
    if (!response.data || !response.data.url) {
      throw new Error('Invalid media response: No URL found');
    }
    
    return response.data.url;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error getting media URL - Status:', error.response.status);
      console.error('Error getting media URL - Data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error getting media URL - No response received');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error getting media URL:', error.message);
    }
    throw new Error(`Failed to get media URL: ${error.message}`);
  }
};

/**
 * Download media from URL
 * @param {string} url - The URL to download from
 * @returns {Promise<Buffer>} - The downloaded media as a buffer
 */
exports.downloadMedia = async (url) => {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiToken}`
      },
      responseType: 'arraybuffer'
    });
    
    if (!response.data) {
      throw new Error('No data received when downloading media');
    }
    
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    if (error.response) {
      console.error('Error downloading media - Status:', error.response.status);
    } else if (error.request) {
      console.error('Error downloading media - No response received');
    } else {
      console.error('Error downloading media:', error.message);
    }
    throw new Error(`Failed to download media: ${error.message}`);
  }
};

/**
 * Upload media to WhatsApp API
 * @param {string} filePath - Path to the file to upload
 * @returns {Promise<string>} - Media ID from WhatsApp API
 */
exports.uploadMedia = async (filePath) => {
  try {
    // Read the file
    const fileData = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    
    // Determine MIME type based on extension
    let mimeType = 'application/octet-stream'; // Default
    if (filePath.endsWith('.ics')) {
      mimeType = 'text/calendar';
    } else if (filePath.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (filePath.endsWith('.png')) {
      mimeType = 'image/png';
    }
    
    console.log(`Uploading file ${fileName} (${fileStats.size} bytes, ${mimeType})`);
    
    // Create a temporary file for the form-data to read from
    const tempFile = path.join(path.dirname(filePath), `temp-${fileName}`);
    fs.writeFileSync(tempFile, fileData);
    
    try {
      // Create form data
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFile), {
        filename: fileName,
        contentType: mimeType
      });
      form.append('messaging_product', 'whatsapp');
      form.append('type', mimeType);
      
      // Upload the file
      const response = await axios({
        method: 'POST',
        url: `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/media`,
        headers: {
          'Authorization': `Bearer ${config.whatsapp.apiToken}`,
          ...form.getHeaders()
        },
        data: form,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      // Clean up temporary file
      fs.unlinkSync(tempFile);
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid media upload response: No ID found');
      }
      
      console.log('Media uploaded successfully, ID:', response.data.id);
      return response.data.id;
    } finally {
      // Make sure to clean up the temp file even if there's an error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    console.error('Error uploading media:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

/**
 * Send a message with an attachment via WhatsApp
 * @param {string} to - The recipient's phone number
 * @param {string} message - The message to send
 * @param {string} filePath - Path to the file to attach
 * @returns {Promise<object>} - Response from the WhatsApp API
 */
exports.sendMessageWithAttachment = async (to, message, filePath) => {
  try {
    console.log(`Sending message with attachment to ${to}, file: ${filePath}`);
    
    // Validate inputs
    if (!to) throw new Error('Recipient phone number is required');
    if (!message) throw new Error('Message content is required');
    if (!filePath) throw new Error('File path is required');
    if (!config.whatsapp.phoneNumberId) throw new Error('WhatsApp Phone Number ID not configured');
    if (!config.whatsapp.apiToken) throw new Error('WhatsApp API Token not configured');
    
    // Format phone number (remove + if present)
    const formattedNumber = to.startsWith('+') ? to.substring(1) : to;
    
    // First, send the text message
    console.log('Sending initial text message...');
    await exports.sendMessage(to, message);
    
    console.log('Uploading attachment file...');
    // Upload the file to WhatsApp media API
    const mediaId = await exports.uploadMedia(filePath);
    console.log(`File uploaded successfully, got media ID: ${mediaId}`);
    
    // Then, determine the file type and send as appropriate attachment
    console.log('Sending attachment...');
    const fileName = path.basename(filePath);
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'document',
        document: {
          id: mediaId,
          caption: 'Calendar event file',
          filename: fileName
        }
      }
    });
    
    console.log('Attachment sent successfully');
    return response.data;
  } catch (error) {
    console.error('Error in sendMessageWithAttachment:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

/**
 * Send a message via WhatsApp
 * @param {string} to - The recipient's phone number
 * @param {string|object} message - The message to send or event details object
 * @param {boolean} isEventDetails - Whether the message is event details
 * @param {string} icalFilePath - Path to iCal file to attach (optional)
 * @returns {Promise<object>} - Response from the WhatsApp API
 */
exports.sendMessage = async (to, message, isEventDetails = false, icalFilePath = null) => {
  try {
    // Validate inputs
    if (!to) throw new Error('Recipient phone number is required');
    if (!message) throw new Error('Message content is required');
    if (!config.whatsapp.phoneNumberId) throw new Error('WhatsApp Phone Number ID not configured');
    if (!config.whatsapp.apiToken) throw new Error('WhatsApp API Token not configured');
    
    // Format the message if it's event details
    const messageText = isEventDetails ? formatEventMessage(message) : message;
    
    // If we have an iCal file, send as attachment
    if (icalFilePath && fs.existsSync(icalFilePath)) {
      return await exports.sendMessageWithAttachment(to, messageText, icalFilePath);
    }
    
    // Format phone number (remove + if present)
    const formattedNumber = to.startsWith('+') ? to.substring(1) : to;
    
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText
        }
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error sending message - Status:', error.response.status);
      console.error('Error sending message - Data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('Error sending message - No response received');
    } else {
      console.error('Error sending message:', error.message);
    }
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

/**
 * Log the WhatsApp API response for debugging
 * @param {object} apiResponse - The API response object
 */
exports.logApiResponse = (apiResponse) => {
  try {
    console.log('WhatsApp API Response:', JSON.stringify(apiResponse, null, 2));
  } catch (error) {
    console.error('Error logging API response:', error);
  }
};

/**
 * Send a simple text message to a WhatsApp user
 * @param {string} to - The recipient's phone number
 * @param {string} text - The message text to send
 * @returns {Promise<object>} - The API response
 */
exports.sendTextMessage = async (to, text) => {
  try {
    console.log(`Sending text message to ${to}: ${text.substring(0, 50)}...`);
    
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`,
      headers: {
        Authorization: `Bearer ${config.whatsapp.apiToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: true,
          body: text
        }
      }
    });
    
    console.log('Message sent successfully:', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Error sending text message:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, JSON.stringify(error.response.data));
    }
    throw error;
  }
}; 
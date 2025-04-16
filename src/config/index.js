// Load environment variables
require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // WhatsApp Business API configuration
  whatsapp: {
    apiToken: process.env.WHATSAPP_API_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
  },
  
  // Google Cloud Vision configuration
  google: {
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
  }
}; 
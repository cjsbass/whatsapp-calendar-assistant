# WhatsApp Calendar Assistant

A WhatsApp bot that processes event invitation images and generates calendar links using Twilio, Google Cloud Vision API, and Vercel serverless deployment.

## 🚀 Current Status

✅ **WORKING** - WhatsApp messaging via Twilio  
✅ **DEPLOYED** - Live on Vercel serverless platform  
✅ **RESPONDING** - Text message handling functional  
🔧 **IN PROGRESS** - Image processing being restored  

**Live Webhook**: `https://whatsapp-calendar-assistant-2ttdph4ko.vercel.app/api/webhook`  
**WhatsApp Number**: `+1 (380) 205-9479`

## 📱 Features

### Current Features (Working)
- ✅ Receive WhatsApp messages via Twilio
- ✅ Send automated responses 
- ✅ Help and welcome messages
- ✅ Error handling and logging

### Upcoming Features (Being Restored)
- 🔧 Process event invitation images with Google Cloud Vision
- 🔧 Extract event details (title, date, time, location)
- 🔧 Generate Google Calendar links
- 🔧 Support for multiple calendar formats

## 🛠 Technology Stack

- **Backend**: Node.js + Express
- **WhatsApp API**: Twilio WhatsApp Business API
- **Image Processing**: Google Cloud Vision API (being restored)
- **Deployment**: Vercel Serverless Functions
- **Environment**: Production-ready cloud deployment

## 📋 Environment Variables

Required environment variables (all configured in Vercel):

```bash
# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+13802059479

# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=whatsapp-calendar-service-001
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLOUD_PRIVATE_KEY=your_private_key_with_newlines

# Deployment
NODE_ENV=production
```

## 🚀 Deployment

The application is deployed on Vercel with the following configuration:

### Current Deployment
- **URL**: https://whatsapp-calendar-assistant-2ttdph4ko.vercel.app
- **Status**: ✅ Active and responding
- **Environment**: Production
- **Region**: Washington, D.C., USA (East)

### Twilio Configuration
- **Webhook URL**: `https://whatsapp-calendar-assistant-2ttdph4ko.vercel.app/api/webhook`
- **Method**: HTTP POST
- **Phone Number**: +1 (380) 205-9479
- **Service**: WhatsApp Business API

## 💬 Usage

### Text Messages
Send any text message to `+1 (380) 205-9479`:
- **"test"**, **"hello"**, **"hi"** → Get help message
- **Any other text** → Echo response confirming receipt

### Image Messages (Coming Soon)
- Send event invitation screenshots
- Receive extracted event details
- Get Google Calendar links

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run locally
npm start
```

### Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Update environment variables
vercel env add VARIABLE_NAME production
```

## 📁 Project Structure

```
src/
├── index.js                 # Main application (simplified for serverless)
├── services/
│   ├── vision.service.js    # Google Cloud Vision integration
│   ├── calendar.service.js  # Calendar link generation
│   └── twilio.service.js    # Twilio WhatsApp service
└── routes/
    ├── index.js             # Main routes
    ├── whatsapp.routes.js   # WhatsApp webhook routes
    └── twilio.routes.js     # Twilio webhook routes

vercel.json                  # Vercel deployment configuration
package.json                 # Dependencies and scripts
```

## 🐛 Troubleshooting

### Common Issues

1. **No response to WhatsApp messages**
   - Check Twilio webhook URL is correct
   - Verify environment variables in Vercel
   - Check Vercel function logs

2. **Function deployment errors**
   - Ensure no file system operations in serverless code
   - Check Google Cloud credentials format
   - Verify all dependencies are in package.json

3. **Google Cloud Vision errors**
   - Ensure private key newlines are properly escaped
   - Verify service account permissions
   - Check project ID matches

### Monitoring
- **Logs**: https://vercel.com/cornellbasson-gmailcoms-projects/whatsapp-calendar-assistant/logs
- **Status**: Check webhook endpoint health at `/api/webhook`
- **Testing**: Send test messages to verify functionality

## 🔒 Security

- All sensitive credentials stored as Vercel environment variables
- HTTPS-only webhook endpoints
- No local file storage in serverless environment
- Twilio webhook signature verification (can be added)

## 📈 Next Steps

1. **Restore Image Processing**
   - Fix Google Cloud Vision API serverless compatibility
   - Add back event detail extraction
   - Restore calendar link generation

2. **Enhanced Features**
   - Support for multiple languages
   - Advanced date/time parsing
   - Multiple calendar format support (Outlook, Apple Calendar)
   - Event reminder setup

3. **Production Improvements**
   - Add webhook signature verification
   - Implement rate limiting
   - Add comprehensive error tracking
   - Performance monitoring

## 📞 Support

- **Developer**: Available for debugging and enhancements
- **Logs**: Monitor via Vercel dashboard
- **Issues**: Test webhook endpoint and check environment variables

---

**Status**: ✅ Core messaging functional | 🔧 Image processing being restored  
**Last Updated**: June 13, 2025  
**Version**: 2.0 (Serverless) 
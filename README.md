# WhatsApp Calendar Assistant

A WhatsApp bot that extracts event details from screenshots or images of invitations and creates calendar events with clickable links, allowing users to easily add events to their calendars.

## ✅ Status: FULLY OPERATIONAL - DEPLOYED TO PRODUCTION

**Last Updated:** June 13, 2025  
**System Status:** 🟢 Live and Working  
**Production URL:** https://whatsapp-calendar-assistant-kx6k5kjir.vercel.app  
**WhatsApp Number:** +1 (380) 205-9479  
**Quick Link:** https://wa.me/13802059479

## Features

- 📱 **WhatsApp Integration**: Receive images and send calendar links through WhatsApp
- 🖼️ **Image Processing**: Extract text from images using Google Cloud Vision API
- 📅 **Event Detail Extraction**: Intelligent parsing of dates, times, locations, and event titles
- 📆 **Calendar Integration**: Generate calendar links for multiple platforms
  - iPhone Calendar (using `calshow://` protocol)
  - Google Calendar (optimized for both mobile and desktop)
  - Outlook
  - Yahoo Calendar
- 🔗 **URL Shortening**: Create short, manageable URLs for all calendar links
- 🌐 **Webhook Support**: Integrate with the WhatsApp Business API

## Recent Updates

### System Restoration (June 2025)
- ✅ **Dependencies**: Restored all Node.js packages via package.json
- ✅ **Twilio Integration**: Fixed credentials and phone number alignment
- ✅ **Google Cloud Vision**: Set up proper API credentials and service account
- ✅ **Environment Configuration**: All variables properly configured
- ✅ **Error Handling**: Removed graceful degradation for proper error reporting
- ✅ **Token Management**: Direct token interception working correctly

### Calendar Link Optimization (April 2025)
- Enhanced Google Calendar links to better open in mobile apps
- Added direct iPhone Calendar support via `calshow://` protocol
- Improved link formatting in WhatsApp messages
- Optimized URL formats for all calendar types

### General Enhancements
- Improved error handling and logging
- Better date/time parsing for various invitation formats
- Clearer user instructions in messages

## Setup

### Prerequisites

- Node.js (v16+)
- WhatsApp Business API account  
- Twilio Account (for WhatsApp integration)
- Google Cloud Vision API credentials
- ngrok or similar for exposing localhost (during development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-calendar-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.backup` to `.env`
   - Update with your actual credentials (see below)

4. **Start the server**
   ```bash
   npm start
   ```

### Environment Variables

Your `.env` file should contain:

```env
# Server Config
PORT=3000
NODE_ENV=development
BASE_URL=your_ngrok_url

# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER=13802059479

# Twilio API
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+13802059479

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=google-cloud-credentials/google-credentials.json
```

### Google Cloud Setup

To set up Google Cloud Vision API credentials:

```bash
# Set your project
gcloud config set project your-project-id

# Enable Vision API
gcloud services enable vision.googleapis.com

# Create service account
gcloud iam service-accounts create whatsapp-calendar-bot \
  --display-name="WhatsApp Calendar Assistant"

# Grant permissions
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:whatsapp-calendar-bot@your-project-id.iam.gserviceaccount.com" \
  --role="roles/ml.developer"

# Generate credentials
gcloud iam service-accounts keys create google-cloud-credentials/google-credentials.json \
  --iam-account=whatsapp-calendar-bot@your-project-id.iam.gserviceaccount.com
```

## Usage

### How to Use the WhatsApp Calendar Assistant

**WhatsApp Number:** +1 (380) 205-9479  
**Quick Link:** https://wa.me/13802059479  
**Status:** ✅ **LIVE & OPERATIONAL**

1. **Send a Message**: Click the wa.me link above or add +13802059479 to your WhatsApp contacts
2. **Send an Image**: Take a screenshot or photo of any event invitation (wedding invites, conference tickets, party invitations, etc.)
3. **Get Calendar Links**: The bot will automatically extract event details and send you clickable calendar links
4. **Add to Calendar**: Tap the calendar link that corresponds to your preferred calendar app (iPhone Calendar, Google Calendar, Outlook)

### What the Bot Can Extract:
- 📝 Event title and description
- 📅 Date and time information  
- 📍 Location details
- ⏱️ Duration
- 🎫 Event type recognition

### Supported Calendar Formats:
- 📱 iPhone Calendar (native app integration)
- 📊 Google Calendar (mobile & desktop optimized)
- 📧 Outlook Calendar
- 📋 Yahoo Calendar
- 📄 .ics file download

## Webhook Configuration

See the `WHATSAPP-WEBHOOK-SETUP.md` file for detailed instructions on setting up the webhook with Meta's WhatsApp Business API.

## Adding to Your Calendar

The assistant provides links for different calendar types:

- **iPhone users**: Tap the iPhone Calendar link to open directly in your native Calendar app
- **Android/Google Calendar users**: Tap the Google Calendar link to add to Google Calendar

## License

MIT 
# WhatsApp Calendar Assistant

A WhatsApp bot that extracts event details from screenshots or images of invitations and creates calendar events with clickable links, allowing users to easily add events to their calendars.

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

## Recent Improvements

### Token Management (April 2025)
- Fixed issues with token handling in the WhatsApp API
- Implemented direct token interception for all Facebook Graph API calls
- Added module-level patching to ensure correct token usage

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
- Google Cloud Vision API credentials
- ngrok or similar for exposing localhost (during development)

### Environment Variables

Create a `.env` file with the following:

```
# Server Config
PORT=3000

# WhatsApp Business API
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Google Cloud credentials
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials_file

# URL configuration
BASE_URL=your_public_url

# Other Configuration
NODE_ENV=development
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

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
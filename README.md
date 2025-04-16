# WhatsApp Calendar Assistant

A WhatsApp bot that extracts event details from images and creates calendar events.

## Features

- Processes images received via WhatsApp
- Uses Google Cloud Vision API for text extraction
- Parses event details (title, date, time, location)
- Generates calendar links for Google Calendar, Outlook, and Yahoo Calendar
- Creates and sends iCal (.ics) files for direct calendar import
- Sends a formatted response with event summary and calendar links

## How It Works

1. User sends a screenshot of an event invitation to the WhatsApp number
2. The webhook receives the message and downloads the image
3. Google Cloud Vision API extracts text from the image
4. The app parses event details from the extracted text
5. Calendar links are generated for different calendar services
6. An iCal (.ics) file is created for direct calendar import
7. A formatted response with event details, calendar links, and the iCal attachment is sent back to the user

## Setup

### Requirements

- Node.js 16+
- WhatsApp Business API account
- Google Cloud Vision API credentials
- Ngrok or similar service for webhook exposure

### Environment Variables

Create a `.env` file with:

```
# WhatsApp API credentials
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WEBHOOK_VERIFY_TOKEN=your_webhook_verification_token

# Google Cloud credentials
GOOGLE_APPLICATION_CREDENTIALS=path_to_google_credentials.json
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`
4. Expose your local server using ngrok: `ngrok http 3000`
5. Configure the WhatsApp Business API webhook to point to your ngrok URL

### Ngrok Setup (Recommended)

For the best user experience, it's recommended to use a premium ngrok account to avoid the interstitial page that appears with free accounts:

1. Sign up for a premium ngrok account at https://dashboard.ngrok.com/billing/subscription
2. Set up a reserved domain or custom domain in your ngrok dashboard
3. Update your ngrok configuration:

```bash
# Add your authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Create a configuration file
cat > ngrok-config.yml << EOL
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  whatsapp-calendar:
    proto: http
    addr: 3000
    domain: YOUR_RESERVED_DOMAIN.ngrok.io
EOL

# Start ngrok with your custom domain
ngrok start --config=ngrok-config.yml whatsapp-calendar
```

4. Update your WhatsApp webhook URL to use your custom domain

### WhatsApp Token Management

WhatsApp API tokens from the Meta Developer Console expire after 24 hours. For a production application, you have these options:

#### Option 1: Manual Token Refresh (Easy but requires daily attention)

1. Go to the [Meta Developer Console](https://developers.facebook.com/apps/)
2. Navigate to your app > WhatsApp > API Setup
3. Copy the temporary access token
4. Update your token in the project:
   ```
   node update-token.js
   ```

#### Option 2: System User Token (Recommended for production)

For longer-lasting token management (tokens valid for 60 days):

1. Go to [Meta Business Manager](https://business.facebook.com/settings/system-users)
2. Create a System User with WhatsApp permissions
3. Generate a System User Access Token with 60-day expiration
4. Use the token refresh utility:
   ```
   node token-refresh.js
   ```
5. Save your System User Token when prompted to enable automatic refreshes

#### Option 3: Automatic Token Refresh (Best for production)

Set up an automated process to refresh tokens before they expire:

1. Add your System User Token to your `.env` file:
   ```
   SYSTEM_USER_ACCESS_TOKEN=your_system_user_token
   ```

2. Set up a scheduled task to refresh the token automatically:
   ```
   # Run daily at midnight
   0 0 * * * cd /path/to/app && node token-refresh.js >> logs/token-refresh.log 2>&1
   ```

3. Monitor token validity with:
   ```
   node token-monitor.js
   ```

## Usage

Simply send a screenshot of an event invitation to your WhatsApp Business number. The assistant will:

1. Extract the event details
2. Send back a formatted message with:
   - Event title, date, time, and location
   - Links to add the event to Google Calendar, Outlook, or Yahoo Calendar
   - An attached iCal (.ics) file for direct import to any calendar application

## Calendar Integration

The assistant provides multiple ways to add events to calendars:

- **Calendar Links** - One-click links for Google Calendar, Outlook, and Yahoo Calendar
- **iCal Attachment** - A standard .ics file that can be imported into any calendar application

These options work on both mobile and desktop devices, providing a seamless experience for adding events to any calendar app.

## Development

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests

## Troubleshooting

- Check server logs in the `logs` directory
- `webhook-events.log` contains all incoming webhook events
- Make sure Google Cloud Vision API credentials are properly configured
- Verify that your WhatsApp Business API token is valid and not expired 
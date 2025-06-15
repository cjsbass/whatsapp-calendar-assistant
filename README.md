# Kairos 🗓️ v6.0

A powerful AI-powered calendar assistant that extracts event details from wedding invitation images and generates Google Calendar links using **MessageBird** and **Google Cloud Vision API**.

## 🆕 What's New in v6.0
- **Switched from Twilio to MessageBird** for better reliability and delivery rates
- Improved webhook processing with JSON payload handling
- Enhanced error logging and debugging
- Simplified deployment process

## Features

- 📸 **Image Processing**: Upload wedding invitation images via WhatsApp
- 🔍 **Text Extraction**: Uses Google Cloud Vision API to extract text from images
- 📅 **Calendar Integration**: Automatically generates Google Calendar links
- 🤖 **WhatsApp Bot**: Responds instantly with calendar links via MessageBird
- ☁️ **Serverless**: Deployed on Vercel for automatic scaling

## Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/kairos.git
cd kairos
npm install
```

### 2. Configure MessageBird
Follow the detailed setup guide in `messagebird-setup.md`:
1. Create MessageBird account
2. Get API key 
3. Set up WhatsApp Business API
4. Configure webhook URL

### 3. Set Environment Variables
```bash
# MessageBird
printf 'live_YOUR_API_KEY\n' | vercel env add MESSAGEBIRD_API_KEY production

# Google Cloud Vision
printf 'YOUR_PROJECT_ID\n' | vercel env add GOOGLE_CLOUD_PROJECT_ID production  
printf 'YOUR_CLIENT_EMAIL\n' | vercel env add GOOGLE_CLOUD_CLIENT_EMAIL production
printf 'YOUR_PRIVATE_KEY\n' | vercel env add GOOGLE_CLOUD_PRIVATE_KEY production
```

### 4. Deploy
```bash
vercel deploy --prod --yes
```

### 5. Configure Webhook
In MessageBird Dashboard:
- Set webhook URL to: `https://your-deployment.vercel.app/api/webhook`
- Enable `message.received` events

## How It Works

1. **Send Image**: User sends wedding invitation image to WhatsApp
2. **Process**: Kairos downloads image and extracts text using Google Cloud Vision
3. **Parse**: Extracts event details (names, date, time, location)
4. **Generate**: Creates Google Calendar link with event details
5. **Reply**: Sends calendar link back via WhatsApp

## Example

Input: Wedding invitation image
Output: 
```
🎉 Success!

Event: Wedding: Alice & Anton
Date: 29TH DECEMBER 2022  
Time: 4.30PM
Location: Fleur du Cap, Somerset West

Calendar Link: https://calendar.google.com/calendar/render?action=TEMPLATE&text=Wedding...
```

## Technology Stack

- **Backend**: Node.js, Vercel serverless functions
- **WhatsApp**: MessageBird API
- **Image Processing**: Google Cloud Vision API
- **Calendar**: Google Calendar URL generation
- **Deployment**: Vercel

## Troubleshooting

### Check Logs
```bash
vercel logs your-deployment-url.vercel.app
```

### Common Issues
1. **No response**: Check MessageBird webhook URL configuration
2. **Image processing fails**: Verify Google Cloud Vision API credentials
3. **Calendar link errors**: Check date/time parsing in logs

## Migration from Twilio

If migrating from the previous Twilio version:
1. Remove old Twilio environment variables
2. Set up MessageBird account and API key
3. Update webhook URL in MessageBird instead of Twilio
4. Deploy new version

## Why MessageBird?

- ✅ Better global delivery rates
- ✅ Simpler API and webhook format  
- ✅ More competitive pricing
- ✅ Superior documentation
- ✅ Streamlined setup process

## Support

- MessageBird Docs: https://developers.messagebird.com/
- Google Cloud Vision: https://cloud.google.com/vision/docs
- Vercel Deployment: https://vercel.com/docs

## License

MIT License 
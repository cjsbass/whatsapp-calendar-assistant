# 🚀 Kairos - Deployment Guide

Deploy your own instance of the AI-powered Kairos calendar assistant that converts event invitations into professional calendar links.

## 🎯 One-Click Deploy Options

### Vercel (Recommended) ⚡

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cjsbass/kairos)

**Steps:**
1. Click the Vercel button above
2. Connect GitHub and import the repository
3. Configure environment variables
4. Deploy

### 3. 🟦 Render

1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Select "New Web Service"
4. Choose this repository
5. Configure environment variables
6. Deploy

## 🔧 Environment Variables Required

Create these environment variables in your deployment platform:

### WhatsApp Business API (Facebook)
```
WHATSAPP_TOKEN=your_facebook_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
```

### Twilio WhatsApp API (Alternative)
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+your_twilio_number
```

### Google Cloud Vision API
```
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials_file
```
*Note: For cloud deployments, encode your credentials file as base64 and decode at runtime*

### Server Configuration
```
PORT=3000
NODE_ENV=production
BASE_URL=your_deployed_url
```

## 📱 WhatsApp Setup Options

### Option A: Facebook WhatsApp Business API
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a WhatsApp Business app
3. Get your access token and phone number ID
4. Configure webhook URL: `https://your-domain.com/api/webhook`

### Option B: Twilio WhatsApp API  
1. Sign up at [Twilio](https://twilio.com)
2. Get WhatsApp sandbox or approved number
3. Configure webhook URL: `https://your-domain.com/api/twilio`

## 🔐 Google Cloud Vision Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Vision API
4. Create a service account
5. Download the credentials JSON file
6. For cloud deployment: encode as base64 and set as environment variable

## 🌐 Custom Domain Setup

### Railway
1. Go to your Railway project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Vercel
1. Go to your Vercel project
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records

## 🔄 Automatic Deployments

All platforms support automatic deployments:
- Push to GitHub `main` branch
- Changes automatically deploy
- Environment variables persist

## 🛠️ Local Development

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in your credentials
4. Run:
```bash
npm install
npm start
```

## 📞 Support

If you need help with deployment:
1. Check the platform-specific documentation
2. Ensure all environment variables are set correctly
3. Verify WhatsApp webhook configuration
4. Test with a simple text message first

## 🔒 Security Notes

- Never commit credentials to git
- Use environment variables for all secrets
- Enable HTTPS (automatic on most platforms)
- Regularly rotate API tokens
- Monitor usage and costs

---

**Ready to deploy?** Choose your preferred platform above and get your Kairos AI calendar assistant live in minutes! 
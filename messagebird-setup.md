# MessageBird WhatsApp Setup Guide

## Step 1: Create MessageBird Account
1. Go to [MessageBird Dashboard](https://dashboard.messagebird.com/en/sign-up)
2. Sign up for a free account
3. Verify your email and phone number

## Step 2: Get API Key
1. In MessageBird Dashboard → Settings → Developers → API access
2. Copy your "Live API Key" (starts with `live_`)
3. Update Vercel environment variable:
   ```bash
   printf 'live_YOUR_ACTUAL_API_KEY\n' | vercel env add MESSAGEBIRD_API_KEY production --force
   ```

## Step 3: Set Up WhatsApp
1. In MessageBird Dashboard → Channels → WhatsApp
2. Click "Get Started" on WhatsApp Business API
3. Follow the setup wizard:
   - Verify your business
   - Add your phone number
   - Complete WhatsApp verification

## Step 4: Configure Webhook
1. In MessageBird Dashboard → Channels → WhatsApp → Settings
2. Set Webhook URL to: `https://kairos-XXXXXX.vercel.app/api/webhook`
3. Enable events: `message.received`
4. Save settings

## Step 5: Test
1. Send a message to your WhatsApp Business number
2. Check Vercel logs for successful processing
3. Should receive automated reply

## MessageBird vs Twilio Benefits:
- ✅ Better delivery rates globally
- ✅ Simpler API and webhook format
- ✅ More competitive pricing
- ✅ Better documentation
- ✅ No complex phone number verification process

## Support:
- MessageBird Docs: https://developers.messagebird.com/
- WhatsApp API Guide: https://developers.messagebird.com/apis/whatsapp/ 
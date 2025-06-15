# WhatsApp Webhook Setup Guide

## Problem
The Kairos AI calendar assistant is not receiving image messages because the webhook is not properly configured or subscribed to the necessary events in the Meta Developer Portal.

## Solution

Follow these steps to properly configure your WhatsApp webhook:

### 1. Check Current ngrok URL

First, confirm your current ngrok URL by running:

```bash
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | grep -o 'https://[^"]*'
```

Current URL: `https://apt-reindeer-quickly.ngrok-free.app`

### 2. Verify Webhook Configuration in Meta Developer Portal

1. Go to [Meta Developer Dashboard](https://developers.facebook.com/)
2. Select your WhatsApp Business app
3. Navigate to **WhatsApp** > **Configuration** in the left sidebar
4. Scroll down to the **Webhooks** section

### 3. Check Webhook Setup

Ensure your webhook is properly set up with:

- **Callback URL**: `https://apt-reindeer-quickly.ngrok-free.app/api/webhook`
- **Verify Token**: `d06bfb2ab638cd9c34ba1e9f2f11e66a` (as in your .env file)
- **Subscribed Fields**: Make sure you've subscribed to:
  - `messages`
  - `message_status_updates` (optional, for delivery receipts)

### 4. Test Webhook Manually

You can test your webhook manually by using:

```bash
curl -s "https://apt-reindeer-quickly.ngrok-free.app/api/webhook?hub.mode=subscribe&hub.verify_token=d06bfb2ab638cd9c34ba1e9f2f11e66a&hub.challenge=TEST_CHALLENGE"
```

If it returns `TEST_CHALLENGE`, your server is correctly responding to verification requests.

### 5. Troubleshooting Steps

If you're still not receiving message webhooks:

1. **Unsubscribe and Resubscribe**: In the Meta Developer Portal, try unsubscribing from the webhook fields and then resubscribing to refresh the connection.

2. **Check Webhook Status**: In the Meta Developer Portal, check the webhook status indicator. If it shows as "Failed" or "Inactive," click on "Manage" to troubleshoot.

3. **Test Send vs. Real Send**: Test sending a message directly from the Meta Developer Portal's "API Setup" page to check if it generates webhook events.

4. **Check Message Privacy**: Make sure the test WhatsApp account can receive messages from your business account. The user might need to send a message to you first before you can send messages to them.

5. **Check Error Logs**: Check the Business Manager -> WhatsApp -> Diagnostics page for webhook delivery errors.

### 6. If All Else Fails

1. **Create a New Webhook**: Try creating a completely new webhook subscription with the same URL and verify token.

2. **Regenerate ngrok URL**: Restart ngrok to get a fresh URL, then update the webhook URL in the Meta Developer Portal.

3. **Contact Meta Support**: If you continue to have issues, contact Meta Business Support for assistance with your WhatsApp Business API account. 
/**
 * Utility script to help setup and manage your WhatsApp webhook
 * 
 * This script provides instructions on how to setup and test your webhook,
 * and offers commands to manage your WhatsApp webhook registration.
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const readline = require('readline');

// Generate a random verify token if one doesn't exist
const generateVerifyToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// URL for managing app subscriptions
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

// Print help information
function printHelp() {
  console.log('\n=== WhatsApp Webhook Setup Utility ===');
  console.log('\nThis utility helps you set up and test your WhatsApp webhook.');
  console.log('\nBefore using this utility:');
  console.log('1. Make sure your .env file is configured with:');
  console.log('   - WHATSAPP_API_TOKEN');
  console.log('   - WHATSAPP_PHONE_NUMBER_ID');
  console.log('   - WHATSAPP_VERIFY_TOKEN (can be any string you choose)');
  console.log('\n2. Make sure your webhook is publicly accessible.');
  console.log('   You can use ngrok (https://ngrok.com) for testing locally.');
  console.log('\nAvailable commands:');
  console.log('1 - Check WABA (WhatsApp Business Account) Info');
  console.log('2 - Get Phone Number Info');
  console.log('3 - Set up webhook subscription');
  console.log('4 - Check webhook subscriptions');
  console.log('5 - Send test message to a number');
  console.log('6 - Exit');
}

// Function to set up webhook with Meta
async function registerWebhook(phoneNumberId, apiToken, verifyToken, webhookUrl) {
  try {
    console.log('\nAttempting to register webhook with Meta...');
    
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${phoneNumberId}/subscribed_apps`,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        access_token: apiToken
      }
    });
    
    console.log('Webhook registration response:', JSON.stringify(response.data, null, 2));
    console.log('\n✅ Webhook registered successfully!');
    console.log('\nIMPORTANT: You still need to configure your webhook URL in the Meta Developer Dashboard:');
    console.log(`1. Go to https://developers.facebook.com/apps/`);
    console.log(`2. Select your app`);
    console.log(`3. Go to WhatsApp > Configuration`);
    console.log(`4. Under Webhooks, click "Configure"`);
    console.log(`5. Enter your webhook URL: ${webhookUrl}`);
    console.log(`6. Enter your verify token: ${verifyToken}`);
    console.log(`7. Subscribe to the "messages" field`);
    
    return response.data;
  } catch (error) {
    console.error('Error registering webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Function to check WhatsApp Business Account details
async function checkBusinessAccount(apiToken) {
  try {
    console.log('\nChecking WhatsApp Business account information...');
    
    const response = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me/accounts',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log('Business account details:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log('No business accounts found or response format unexpected.');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('Error checking business account:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Function to get phone numbers associated with the account
async function getPhoneNumbers(apiToken) {
  try {
    console.log('\nFetching WhatsApp phone numbers...');
    
    const response = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me/phone_numbers',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log('Phone numbers found:');
      response.data.data.forEach((number, index) => {
        console.log(`${index + 1}. ID: ${number.id}, Phone Number: ${number.display_phone_number}, Status: ${number.verified_name}`);
      });
      
      // Return the first phone number ID if available
      return response.data.data[0].id;
    } else {
      console.log('No phone numbers found or response format unexpected.');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('Error fetching phone numbers:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Function to send a test message
async function sendTestMessage(phoneNumberId, apiToken) {
  return new Promise((resolve) => {
    rl.question('\nEnter a phone number to send a test message (with country code, e.g., +1234567890): ', async (to) => {
      try {
        // Format phone number (remove + if present)
        const formattedNumber = to.startsWith('+') ? to.substring(1) : to;
        
        console.log(`\nSending test message to ${to}...`);
        
        const response = await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedNumber,
            type: 'text',
            text: {
              preview_url: false,
              body: 'Hello! This is a test message from Kairos, your AI-powered calendar assistant. Send me a screenshot of an event invitation to create a calendar event!'
            }
          }
        });
        
        console.log('Test message sent successfully:');
        console.log(JSON.stringify(response.data, null, 2));
        resolve(true);
      } catch (error) {
        console.error('Error sending test message:');
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Error data:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.error(error.message);
        }
        resolve(false);
      }
    });
  });
}

// Main function
async function setup() {
  console.log('==========================================');
  console.log('Kairos AI Calendar Assistant - Setup Wizard');
  console.log('==========================================\n');
  
  // Check if .env has the required values
  let apiToken = config.whatsapp.apiToken;
  let phoneNumberId = config.whatsapp.phoneNumberId;
  let verifyToken = config.whatsapp.verifyToken;
  
  if (!apiToken || apiToken === 'your_whatsapp_api_token') {
    console.error('❌ WHATSAPP_API_TOKEN not properly configured in .env file');
    process.exit(1);
  }
  
  // Check business account
  await checkBusinessAccount(apiToken);
  
  // Get phone numbers
  const fetchedPhoneNumberId = await getPhoneNumbers(apiToken);
  
  if (fetchedPhoneNumberId) {
    if (!phoneNumberId || phoneNumberId === 'your_whatsapp_phone_number_id') {
      phoneNumberId = fetchedPhoneNumberId;
      console.log(`\n✅ Found phone number ID: ${phoneNumberId}`);
      console.log('You should add this to your .env file as WHATSAPP_PHONE_NUMBER_ID');
    } else {
      console.log(`\nUsing configured phone number ID: ${phoneNumberId}`);
    }
  } else {
    console.error('\n❌ No phone numbers found for your WhatsApp Business account');
    if (!phoneNumberId || phoneNumberId === 'your_whatsapp_phone_number_id') {
      console.error('Please configure a phone number in your WhatsApp Business account and update your .env file');
      process.exit(1);
    }
  }
  
  // Generate verify token if needed
  if (!verifyToken || verifyToken === 'your_custom_verify_token') {
    verifyToken = generateVerifyToken();
    console.log(`\n✅ Generated verify token: ${verifyToken}`);
    console.log('You should add this to your .env file as WHATSAPP_VERIFY_TOKEN');
  } else {
    console.log(`\nUsing configured verify token: ${verifyToken}`);
  }
  
  // Ask for the webhook URL
  rl.question('\nEnter your public webhook URL (e.g., https://yourdomain.com/api/webhook): ', async (webhookUrl) => {
    // Register webhook
    await registerWebhook(phoneNumberId, apiToken, verifyToken, webhookUrl);
    
    // Send test message
    await sendTestMessage(phoneNumberId, apiToken);
    
    console.log('\n==========================================');
    console.log('Setup completed!');
    console.log('==========================================');
    console.log('\nMake sure to update your .env file with these values:');
    console.log(`WHATSAPP_API_TOKEN=${apiToken}`);
    console.log(`WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId}`);
    console.log(`WHATSAPP_VERIFY_TOKEN=${verifyToken}`);
    
    rl.close();
  });
}

// Run the setup
setup();

// Main menu
async function showMenu() {
  while (true) {
    printHelp();
    
    const choice = await new Promise(resolve => {
      rl.question('\nEnter your choice (1-6): ', answer => {
        resolve(answer.trim());
      });
    });
    
    switch (choice) {
      case '1':
        await checkBusinessAccount();
        break;
      case '2':
        await getPhoneNumbers();
        break;
      case '3':
        await setup();
        break;
      case '4':
        await checkWebhookSubscriptions();
        break;
      case '5':
        await sendTestMessage();
        break;
      case '6':
        console.log('Exiting...');
        rl.close();
        return;
      default:
        console.log('Invalid choice. Please try again.');
    }
    
    await new Promise(resolve => {
      rl.question('\nPress Enter to continue...', () => {
        resolve();
      });
    });
  }
}

// Check webhook subscriptions
async function checkWebhookSubscriptions() {
  try {
    console.log('\nChecking webhook subscriptions...');
    
    if (!config.whatsapp.apiToken) {
      console.error('Error: WHATSAPP_API_TOKEN not configured in .env file');
      return;
    }
    
    if (!config.whatsapp.phoneNumberId) {
      console.error('Error: WHATSAPP_PHONE_NUMBER_ID not configured in .env file');
      return;
    }
    
    const response = await axios({
      method: 'GET',
      url: `${GRAPH_API_URL}/${config.whatsapp.phoneNumberId}/subscribed_apps`,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiToken}`
      }
    });
    
    console.log('Webhook subscriptions:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error checking webhook subscriptions:', error.message);
    }
  }
}

// Start the utility
showMenu().catch(error => {
  console.error('Error running setup utility:', error);
});

 
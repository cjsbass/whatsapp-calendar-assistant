require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Configuration - adjust as needed
const TOKEN_FILE = '.env';
const SYSTEM_USER_ACCESS_TOKEN_ENV = 'SYSTEM_USER_ACCESS_TOKEN';
const APP_ID = '937913005221973'; // Your app ID from the Facebook Developer Portal

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to update the token in .env file
function updateTokenInFile(newToken) {
  try {
    // Read the current .env file
    const envContent = fs.readFileSync(TOKEN_FILE, 'utf8');
    
    // Replace the existing token
    const updatedContent = envContent.replace(
      /WHATSAPP_API_TOKEN=.*/,
      `WHATSAPP_API_TOKEN=${newToken}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(TOKEN_FILE, updatedContent);
    
    console.log('✅ WhatsApp API token updated successfully in .env file!');
    return true;
  } catch (error) {
    console.error('Error updating token in file:', error.message);
    return false;
  }
}

// Function to generate a new WhatsApp token using System User Access Token
async function generateWhatsAppToken(systemUserToken) {
  try {
    console.log('\nGenerating new WhatsApp token using System User Access Token...');
    
    const response = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/v18.0/${APP_ID}/access_token`,
      params: {
        client_id: APP_ID,
        client_secret: process.env.APP_SECRET || '', // Optional if using system user token
        grant_type: 'client_credentials',
        access_token: systemUserToken
      }
    });
    
    if (response.data && response.data.access_token) {
      console.log('✅ Successfully generated new WhatsApp token!');
      return response.data.access_token;
    } else {
      console.error('❌ Failed to generate token. Unexpected response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error generating WhatsApp token:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Main function to handle token refresh
async function refreshToken() {
  console.log(`
===============================================
🔄 WhatsApp Token Refresh Utility
===============================================
`);
  
  // Check if we have a system user token in environment
  const systemUserToken = process.env[SYSTEM_USER_ACCESS_TOKEN_ENV];
  
  if (systemUserToken) {
    // Automatic refresh using system user token
    console.log('System User Access Token found in environment variables.');
    const newToken = await generateWhatsAppToken(systemUserToken);
    
    if (newToken) {
      const updated = updateTokenInFile(newToken);
      if (updated) {
        console.log(`
===============================================
✅ Token refresh completed successfully!
- The token will expire in 24 hours
- Your applications will now use the new token
===============================================
`);
      }
    }
    rl.close();
  } else {
    // Manual input of system user token
    console.log('No System User Access Token found in environment variables.');
    console.log('To set up longer-lasting token management:');
    console.log('1. Go to business.facebook.com > Business Settings > System Users');
    console.log('2. Create a System User with WhatsApp permissions');
    console.log('3. Generate a token with a 60-day expiration');
    console.log('\nYou can either:');
    console.log('- Add SYSTEM_USER_ACCESS_TOKEN to your .env file');
    console.log('- Or enter a System User Token below\n');
    
    rl.question('Enter your System User Access Token (or press Enter to use a temporary token): ', async (token) => {
      if (token && token.trim() !== '') {
        // Use provided system user token
        const newToken = await generateWhatsAppToken(token.trim());
        
        if (newToken) {
          const updated = updateTokenInFile(newToken);
          if (updated) {
            console.log('Would you like to save this System User Token for future use? (y/n)');
            rl.question('', (answer) => {
              if (answer.toLowerCase() === 'y') {
                // Add system user token to .env file for future use
                try {
                  const envContent = fs.readFileSync(TOKEN_FILE, 'utf8');
                  if (envContent.includes(SYSTEM_USER_ACCESS_TOKEN_ENV)) {
                    // Update existing entry
                    const updatedContent = envContent.replace(
                      new RegExp(`${SYSTEM_USER_ACCESS_TOKEN_ENV}=.*`),
                      `${SYSTEM_USER_ACCESS_TOKEN_ENV}=${token.trim()}`
                    );
                    fs.writeFileSync(TOKEN_FILE, updatedContent);
                  } else {
                    // Add new entry
                    fs.appendFileSync(TOKEN_FILE, `\n# System User Access Token (60-day expiration)\n${SYSTEM_USER_ACCESS_TOKEN_ENV}=${token.trim()}\n`);
                  }
                  console.log('✅ System User Token saved for future automatic refreshes.');
                } catch (error) {
                  console.error('Error saving System User Token:', error.message);
                }
              }
              rl.close();
            });
          } else {
            rl.close();
          }
        } else {
          // Failed to generate token
          rl.close();
        }
      } else {
        // No system user token provided, get temporary token manually
        console.log('\n❓ No System User Token provided. Please:');
        console.log('1. Go to https://developers.facebook.com/apps/');
        console.log('2. Select your app');
        console.log('3. Navigate to WhatsApp > API Setup');
        console.log('4. Copy the temporary access token');
        console.log('5. Run node update-token.js and paste the token');
        rl.close();
      }
    });
  }
}

// Start the token refresh process
refreshToken(); 
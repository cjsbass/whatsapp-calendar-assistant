/**
 * WhatsApp Calendar - Automated Setup
 * 
 * This script will automatically configure your WhatsApp calendar app
 * with the correct Phone Number ID and Business Account ID.
 */
const fs = require('fs');
const axios = require('axios');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a question and get the answer
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// Your WhatsApp phone number (from user input)
const PHONE_NUMBER = "15551508797"; // Already formatted without +

// Your WhatsApp Business Account ID
const WABA_ID = "416401061531062"; // Freedom Tech

// Setup configuration
async function setupConfig() {
  console.log("===============================================");
  console.log("WhatsApp Calendar - Automated Setup");
  console.log("===============================================");
  console.log("This script will configure your WhatsApp Calendar app.");
  console.log("");
  console.log("Using WhatsApp Business Account ID:", WABA_ID, "(Freedom Tech)");
  console.log("Using WhatsApp phone number:", "+"+PHONE_NUMBER);
  console.log("===============================================");
  
  // Get the token from user
  const token = await askQuestion("\nPaste your WhatsApp API token with whatsapp_business_messaging permission: ");
  
  if (!token) {
    console.log("❌ Token is required. Please run the script again with a valid token.");
    rl.close();
    return;
  }
  
  // Step 1: Verify the token
  console.log("\n🔍 Step 1: Verifying your token...");
  
  try {
    // Make a simple API call to verify the token
    const userResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("✅ Token is valid! Connected as:", userResponse.data.name || userResponse.data.id);
    
    // Step 2: Look for Phone Number ID
    console.log("\n🔍 Step 2: Finding your WhatsApp Phone Number ID...");
    
    try {
      // Try to get phone numbers associated with this WABA
      const phoneResponse = await axios({
        method: 'GET',
        url: `https://graph.facebook.com/v18.0/${WABA_ID}/phone_numbers`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let phoneNumberId = null;
      
      if (phoneResponse.data && phoneResponse.data.data && phoneResponse.data.data.length > 0) {
        console.log("Found", phoneResponse.data.data.length, "phone number(s):");
        
        // Look for a match with our expected phone number
        for (const phone of phoneResponse.data.data) {
          console.log(`- ${phone.display_phone_number || "Unknown number"} (ID: ${phone.id})`);
          
          // Clean up any formatting in the phone numbers for comparison
          const cleanDisplayNumber = (phone.display_phone_number || "").replace(/\D/g, '');
          
          if (cleanDisplayNumber === PHONE_NUMBER) {
            phoneNumberId = phone.id;
            console.log(`  ✅ This matches your WhatsApp number!`);
          }
        }
        
        if (!phoneNumberId && phoneResponse.data.data.length === 1) {
          // If we only have one phone number, use it
          phoneNumberId = phoneResponse.data.data[0].id;
          console.log(`  ✅ Using the only available phone number.`);
        }
      } else {
        console.log("❌ No phone numbers found for this Business Account ID.");
        
        // Try a different approach - use the one from the .env file if available
        const existingPhoneNumberId = getExistingPhoneNumberId();
        if (existingPhoneNumberId) {
          console.log(`  Using existing Phone Number ID: ${existingPhoneNumberId}`);
          phoneNumberId = existingPhoneNumberId;
        } else {
          // Ask the user to manually enter the Phone Number ID if necessary
          phoneNumberId = await askQuestion("\nEnter your WhatsApp Phone Number ID manually: ");
        }
      }
      
      if (phoneNumberId) {
        console.log("\n✅ Using Phone Number ID:", phoneNumberId);
        
        // Step 3: Create configuration files
        console.log("\n🔧 Step 3: Creating configuration files...");
        
        // Create .env content
        const envContent = `# WhatsApp Calendar Server Config
# Auto-generated on ${new Date().toISOString()}

# Server settings
PORT=3000
NODE_ENV="development"
BASE_URL="https://apt-reindeer-quickly.ngrok-free.app"
APP_SECRET="424d04665932011529ae67b9cf6d8bac"

# WhatsApp Business API settings
WHATSAPP_TOKEN="${token}"
WHATSAPP_PHONE_NUMBER_ID="${phoneNumberId}"
WHATSAPP_VERIFY_TOKEN="d06bfb2ab638cd9c34ba1e9f2f11e66a"
WHATSAPP_BUSINESS_ACCOUNT_ID="${WABA_ID}"
WHATSAPP_PHONE_NUMBER="${PHONE_NUMBER}"

# Google Cloud API settings
GOOGLE_APPLICATION_CREDENTIALS="credentials/google-credentials.json"
`;

        // Write the .env file
        fs.writeFileSync('.env', envContent);
        console.log("✅ Created .env file with proper configuration");
        
        // Update direct-fix.js file to ensure token is used
        updateDirectFix(token);
        
        // Create test message script
        createTestScript(PHONE_NUMBER);
        
        // Final steps
        console.log("\n✅ Setup completed successfully!");
        console.log("\nNext steps:");
        console.log("1. Restart the server with this command:");
        console.log("   pkill -f \"node src/index.js\" && nohup npm start > server.log 2>&1 &");
        console.log("2. Test sending a message with:");
        console.log("   node test-message.js");
      } else {
        console.log("❌ No valid Phone Number ID found. Setup cannot continue.");
      }
    } catch (phoneError) {
      console.error("❌ Error finding phone numbers:");
      handleApiError(phoneError);
      
      // Try to continue with manual entry
      console.log("\nCould not automatically find your Phone Number ID.");
      const phoneNumberId = await askQuestion("Enter your WhatsApp Phone Number ID manually: ");
      
      if (phoneNumberId) {
        // Create .env with manually entered ID
        createEnvFile(token, phoneNumberId);
        updateDirectFix(token);
        createTestScript(PHONE_NUMBER);
      }
    }
  } catch (tokenError) {
    console.error("❌ Token verification failed:");
    handleApiError(tokenError);
    
    if (tokenError.response && tokenError.response.status === 190) {
      console.log("\n🔑 Your token appears to be invalid or expired.");
      console.log("Please generate a new token with these permissions:");
      console.log("- whatsapp_business_management");
      console.log("- whatsapp_business_messaging");
    }
  }
  
  rl.close();
}

// Helper: Get existing Phone Number ID from .env if available
function getExistingPhoneNumberId() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/WHATSAPP_PHONE_NUMBER_ID="([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    // Ignore errors, return null
  }
  return null;
}

// Helper: Handle API errors
function handleApiError(error) {
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Error data:", JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error("No response received from the server.");
  } else {
    console.error("Error:", error.message);
  }
}

// Helper: Update direct-fix.js file with the token
function updateDirectFix(token) {
  try {
    const directFixPath = 'src/direct-fix.js';
    if (fs.existsSync(directFixPath)) {
      const directFixContent = fs.readFileSync(directFixPath, 'utf8');
      const updatedDirectFix = directFixContent.replace(
        /const realToken = "(.*?)";/,
        `const realToken = "${token}";`
      );
      
      fs.writeFileSync(directFixPath, updatedDirectFix);
      console.log("✅ Updated src/direct-fix.js with your token");
    }
  } catch (error) {
    console.error("❌ Could not update direct-fix.js:", error.message);
  }
}

// Helper: Create a simple test script
function createTestScript(phoneNumber) {
  const testContent = `/**
 * WhatsApp Test Message Script
 */
require('dotenv').config();
const axios = require('axios');

// WhatsApp API configuration from .env
const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// The recipient's number should be the same as your WhatsApp Business number during testing
const recipientNumber = "${phoneNumber}";

console.log("===============================================");
console.log("WhatsApp Test Message");
console.log("===============================================");
console.log("Business Account ID:", wabaId);
console.log("Phone Number ID:", phoneNumberId);
console.log("Token (ending with):", token ? "..." + token.slice(-4) : "undefined");
console.log("Sending to:", recipientNumber);
console.log("===============================================");

async function sendTestMessage() {
  try {
    console.log("Sending test message...");
    
    const response = await axios({
      method: 'POST',
      url: \`https://graph.facebook.com/v18.0/\${phoneNumberId}/messages\`,
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: "🎉 WhatsApp Calendar is now configured correctly! This is a test message."
        }
      }
    });
    
    console.log("✅ Message sent successfully!");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Error sending message:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Send the test message
sendTestMessage();
`;

  fs.writeFileSync('test-message.js', testContent);
  console.log("✅ Created test-message.js script");
}

// Helper: Create .env file with manually entered details
function createEnvFile(token, phoneNumberId) {
  const envContent = `# WhatsApp Calendar Server Config
# Auto-generated on ${new Date().toISOString()}

# Server settings
PORT=3000
NODE_ENV="development"
BASE_URL="https://apt-reindeer-quickly.ngrok-free.app"
APP_SECRET="424d04665932011529ae67b9cf6d8bac"

# WhatsApp Business API settings
WHATSAPP_TOKEN="${token}"
WHATSAPP_PHONE_NUMBER_ID="${phoneNumberId}"
WHATSAPP_VERIFY_TOKEN="d06bfb2ab638cd9c34ba1e9f2f11e66a"
WHATSAPP_BUSINESS_ACCOUNT_ID="${WABA_ID}"
WHATSAPP_PHONE_NUMBER="${PHONE_NUMBER}"

# Google Cloud API settings
GOOGLE_APPLICATION_CREDENTIALS="credentials/google-credentials.json"
`;

  fs.writeFileSync('.env', envContent);
  console.log("✅ Created .env file with your configuration");
}

// Run the setup
setupConfig().catch(error => {
  console.error("Error in setup:", error.message);
  rl.close();
}); 
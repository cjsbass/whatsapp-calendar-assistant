/**
 * WhatsApp Business API Fix Script
 * This script helps you configure your WhatsApp Calendar app with proper credentials
 */
const readline = require('readline');
const fs = require('fs');

// Create readline interface for user input
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

async function fixWhatsAppSetup() {
  console.log("===============================================");
  console.log("WhatsApp Business API Fix Script");
  console.log("===============================================");
  console.log("This script will guide you through fixing your WhatsApp Business API setup.");
  console.log("To continue, you'll need:");
  console.log("1. Your WhatsApp Business Account ID (found in the Facebook Business Manager)");
  console.log("2. Your WhatsApp Phone Number ID (from the WhatsApp Business API setup)");
  console.log("3. A valid token with 'whatsapp_business_messaging' permission");
  console.log("===============================================\n");
  
  const wabaId = await askQuestion("Enter your WhatsApp Business Account ID (e.g., 416401061531062): ");
  const phoneNumberId = await askQuestion("Enter your WhatsApp Phone Number ID: ");
  const newToken = await askQuestion("Enter your WhatsApp API token with proper permissions: ");
  
  // Validate inputs
  if (!wabaId || !phoneNumberId || !newToken) {
    console.log("❌ All fields are required. Please try again.");
    rl.close();
    return;
  }
  
  // Create .env content
  const envContent = `# Server Config
# Updated by WhatsApp fix script on ${new Date().toISOString()}

# Server settings
PORT=3000
NODE_ENV="development"
BASE_URL="https://apt-reindeer-quickly.ngrok-free.app"
APP_SECRET="424d04665932011529ae67b9cf6d8bac"

# WhatsApp Business API settings
WHATSAPP_TOKEN="${newToken}"
WHATSAPP_PHONE_NUMBER_ID="${phoneNumberId}"
WHATSAPP_VERIFY_TOKEN="d06bfb2ab638cd9c34ba1e9f2f11e66a"
WHATSAPP_BUSINESS_ACCOUNT_ID="${wabaId}"

# Google Cloud API settings
GOOGLE_APPLICATION_CREDENTIALS="credentials/google-credentials.json"
`;
  
  // Write to .env file
  try {
    fs.writeFileSync('.env', envContent);
    console.log("✅ Updated .env file with new configuration");
  } catch (envError) {
    console.error("❌ Error updating .env file:", envError.message);
  }
  
  // Update direct-fix.js
  try {
    const directFixPath = 'src/direct-fix.js';
    if (fs.existsSync(directFixPath)) {
      const directFixContent = fs.readFileSync(directFixPath, 'utf8');
      const updatedDirectFix = directFixContent.replace(
        /const realToken = "(.*?)";/,
        `const realToken = "${newToken}";`
      );
      
      fs.writeFileSync(directFixPath, updatedDirectFix);
      console.log("✅ Updated src/direct-fix.js with new token");
    } else {
      console.log("❌ src/direct-fix.js file not found");
    }
  } catch (directFixError) {
    console.error("❌ Error updating direct-fix.js:", directFixError.message);
  }
  
  // Create test-message.js script
  const testScriptContent = `
/**
 * Simple WhatsApp Test Message Script
 */
require('dotenv').config();
const axios = require('axios');

// Use the values from environment
const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// Your test phone number
// ADD YOUR WHATSAPP NUMBER HERE (WITH COUNTRY CODE)
const testNumber = ""; // e.g., 393485704725 (no plus sign)

console.log("======================================");
console.log("WhatsApp Test Message");
console.log("======================================");
console.log("Business Account ID:", businessAccountId);
console.log("Phone Number ID:", phoneNumberId);
console.log("Using token ending with:", token ? "..." + token.slice(-4) : "undefined");
console.log("======================================");

async function sendTestMessage() {
  if (!testNumber) {
    console.log("❌ Please edit test-message.js and add your phone number first");
    return;
  }
  
  try {
    console.log(\`Sending test message to \${testNumber}...\`);
    
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
        to: testNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: "🎉 Test message from WhatsApp Calendar fixed setup!"
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

// Run the test
sendTestMessage();
`;
  
  try {
    fs.writeFileSync('test-message.js', testScriptContent);
    console.log("✅ Created test-message.js script to verify your setup");
  } catch (testScriptError) {
    console.error("❌ Error creating test script:", testScriptError.message);
  }
  
  console.log("\n===============================================");
  console.log("✅ Setup completed!");
  console.log("Next steps:");
  console.log("1. Restart your server with this command:");
  console.log("   pkill -f \"node src/index.js\" && nohup npm start > server.log 2>&1 &");
  console.log("2. Edit test-message.js to add your WhatsApp number");
  console.log("3. Run the test script: node test-message.js");
  console.log("===============================================");
  
  rl.close();
}

// Run the script
fixWhatsAppSetup().catch(error => {
  console.error("Error running fix script:", error);
  rl.close();
}); 
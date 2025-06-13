/**
 * WhatsApp Business Phone Number Finder
 * This will find all phone numbers associated with your WhatsApp Business Account
 */
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

// Constants
const WABA_ID = "416401061531062"; // Freedom Tech
const API_VERSION = "v18.0";

async function findPhoneNumbers() {
  console.log("===============================================");
  console.log("WhatsApp Business Phone Number Finder");
  console.log("===============================================");
  console.log("This tool will find all phone numbers associated with");
  console.log("your WhatsApp Business Account ID:", WABA_ID);
  console.log("===============================================");
  
  const token = await askQuestion("\nPaste your WhatsApp API token: ");
  
  if (!token) {
    console.log("❌ Token is required.");
    rl.close();
    return;
  }
  
  console.log("\n🔍 Finding WhatsApp phone numbers...");
  
  try {
    // Try to get user info first to verify token
    const userResponse = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/${API_VERSION}/me`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("✅ Connected as:", userResponse.data.name || userResponse.data.id);
    
    // Get phone numbers for the WABA
    try {
      const phoneResponse = await axios({
        method: 'GET',
        url: `https://graph.facebook.com/${API_VERSION}/${WABA_ID}/phone_numbers`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (phoneResponse.data && phoneResponse.data.data && phoneResponse.data.data.length > 0) {
        console.log("\n📱 FOUND PHONE NUMBERS:");
        console.log("-----------------------------------------------");
        
        phoneResponse.data.data.forEach((phone, index) => {
          console.log(`Phone #${index + 1}:`);
          console.log(`- Phone Number ID: ${phone.id}`);
          console.log(`- Display Number: ${phone.display_phone_number || "Unknown"}`);
          console.log(`- Verified Name: ${phone.verified_name || "Not verified"}`);
          console.log(`- Status: ${phone.status || "Unknown"}`);
          console.log(`- Quality Rating: ${phone.quality_rating || "Unknown"}`);
          console.log("-----------------------------------------------");
        });
        
        console.log("\n✅ CONFIGURATION INSTRUCTIONS:");
        console.log("1. Pick the Phone Number ID that matches your phone number");
        console.log("2. Run the auto-setup.js script with your token");
        console.log("3. When prompted, enter the Phone Number ID you selected");
      } else {
        console.log("\n❌ No phone numbers found for this WhatsApp Business Account.");
        
        // Try to list all WABAs the user has access to
        await listAllWABAs(token);
      }
    } catch (phoneError) {
      console.error("\n❌ Error finding phone numbers:");
      if (phoneError.response) {
        console.error("Status:", phoneError.response.status);
        console.error("Error data:", JSON.stringify(phoneError.response.data, null, 2));
        
        if (phoneError.response.status === 403) {
          console.log("\n🔑 PERMISSION ISSUE: Your token doesn't have permission to access phone numbers.");
          console.log("Generate a new token with these permissions:");
          console.log("- whatsapp_business_management");
          console.log("- whatsapp_business_messaging");
          console.log("- business_management");
        }
      } else {
        console.error(phoneError.message);
      }
      
      // Try to list all WABAs the user has access to
      await listAllWABAs(token);
    }
  } catch (error) {
    console.error("\n❌ Token verification failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
  
  rl.close();
}

// Helper function to list all WABAs the user has access to
async function listAllWABAs(token) {
  console.log("\n🔍 Trying to find all WhatsApp Business Accounts you have access to...");
  
  try {
    // Try to list all WABAs the user has access to
    const wabaResponse = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/${API_VERSION}/me/whatsapp_business_accounts`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (wabaResponse.data && wabaResponse.data.data && wabaResponse.data.data.length > 0) {
      console.log("\n📘 YOUR WHATSAPP BUSINESS ACCOUNTS:");
      console.log("-----------------------------------------------");
      
      wabaResponse.data.data.forEach((waba, index) => {
        console.log(`WABA #${index + 1}:`);
        console.log(`- ID: ${waba.id}`);
        console.log(`- Name: ${waba.name || "Unknown"}`);
        console.log("-----------------------------------------------");
      });
      
      console.log("\nYou might want to try one of these WABA IDs instead of", WABA_ID);
      console.log("Edit auto-setup.js and change the WABA_ID value to one of these");
    } else {
      console.log("\n❌ No WhatsApp Business Accounts found for your user.");
    }
  } catch (wabaError) {
    console.log("\n❌ Could not list WhatsApp Business Accounts:");
    if (wabaError.response) {
      console.log("Status:", wabaError.response.status);
      console.log("Error:", wabaError.response.data.error?.message || JSON.stringify(wabaError.response.data));
    } else {
      console.log(wabaError.message);
    }
  }
}

// Run the finder
findPhoneNumbers().catch(error => {
  console.error("Unexpected error:", error);
  rl.close();
}); 
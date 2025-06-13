/**
 * WhatsApp Business Phone Number ID Finder
 */
require('dotenv').config();
const axios = require('axios');

const token = process.env.WHATSAPP_TOKEN;
const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "416401061531062";

console.log("=======================================");
console.log("WhatsApp Business Phone Number Finder");
console.log("=======================================");
console.log("Business Account ID:", businessAccountId);
console.log("Using token ending with:", token ? "..." + token.slice(-4) : "undefined");
console.log("=======================================\n");

async function findPhoneNumberId() {
  try {
    console.log(`Fetching phone numbers for Business Account ID: ${businessAccountId}...\n`);
    
    // First, try to get all phone numbers associated with the business account
    const response = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/v18.0/${businessAccountId}/phone_numbers`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log("✅ Found phone numbers:");
      console.log("=======================================");
      
      response.data.data.forEach((phone, index) => {
        console.log(`Phone #${index + 1}:`);
        console.log(`- Phone Number ID: ${phone.id}`);
        console.log(`- Display Phone Number: ${phone.display_phone_number}`);
        console.log(`- Verified: ${phone.verified_name || "Not verified"}`);
        console.log(`- Quality Rating: ${phone.quality_rating || "Unknown"}`);
        console.log("---------------------------------------");
      });
      
      console.log("\n🔧 INSTRUCTIONS:");
      console.log("1. Choose the appropriate Phone Number ID from the list above");
      console.log("2. Edit your .env file to update the WHATSAPP_PHONE_NUMBER_ID value");
      console.log("3. Run the quick fix script again: node quickfix.js");
      console.log("4. Restart your server: pkill -f \"node src/index.js\" && nohup npm start > server.log 2>&1 &");
    } else {
      console.log("❌ No phone numbers found for this Business Account ID.");
      console.log("Trying alternative method to get account information...\n");
      
      // Try to get the account information directly
      const accountResponse = await axios({
        method: 'GET',
        url: `https://graph.facebook.com/v18.0/${businessAccountId}`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Account Information:");
      console.log(JSON.stringify(accountResponse.data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error finding phone numbers:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error data:", JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 190) {
        console.log("\n🔑 TOKEN ISSUE: Your token might not have the right permissions or has expired.");
        console.log("Visit https://developers.facebook.com/tools/explorer/ to generate a new token with:");
        console.log("- whatsapp_business_management");
        console.log("- whatsapp_business_messaging");
        console.log("- business_management");
        console.log("permissions selected.");
      } else if (error.response.status === 400 && error.response.data.error.code === 100) {
        console.log("\n🔑 ACCESS ISSUE: You might not have access to this WhatsApp Business Account.");
        console.log("1. Verify you're using the correct Business Account ID");
        console.log("2. Ensure your Facebook user has been added to the WhatsApp Business Account");
        console.log("3. Generate a new token with proper permissions");
      }
    } else {
      console.error(error.message);
    }
  }
}

// Run the finder
findPhoneNumberId(); 
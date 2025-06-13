/**
 * WhatsApp Phone ID Tester
 * This script tries several common WhatsApp Phone ID formats to find a working one
 */
const axios = require('axios');

// Your token and phone number
const TOKEN = "EAARahBZAxZBD8BOy8vLD43Rh5ehr7ItZAyZAkOhgMuJToZAff2XPZC8fdl4wTu924Sy6Wvv1ML7ft8MeA4zd7zlNSZBUHCd0E6iIyCZAv4zbmXSdF3LEeLEIRfEjZCamE1tn2eZA4Fhxf2gNRZAZCpQDnSHkSuhsWLXzUZBwLMn3qXdOmBWinrjhi1mLaWM5b94ugxAZDZD";
const PHONE_NUMBER = "15551508797"; // Without the plus sign

// List of possible phone number IDs to try
// These are common formats and ones we've seen in your configuration
const phoneIdCandidates = [
  "589307174261749", // Current one in your config
  PHONE_NUMBER,       // Try the raw phone number itself
  `1${PHONE_NUMBER}`, // Try with country code prefix
  "416401061531062",  // Try WABA ID as phone ID
  "416401061531062_15551508797", // Try WABA_PHONE format
  "101347219729455",  // Another possible format based on business ID
  "110277878846826",  // Another common format
];

// Test sending a message with a specific Phone Number ID
async function testPhoneId(phoneId) {
  console.log(`\n🔍 Testing Phone Number ID: ${phoneId}`);
  
  try {
    // First try to get phone info
    try {
      const phoneInfoResponse = await axios({
        method: 'GET',
        url: `https://graph.facebook.com/v18.0/${phoneId}`,
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      console.log(`✅ Phone ID exists! Details:`, JSON.stringify(phoneInfoResponse.data, null, 2));
    } catch (infoError) {
      console.log(`ℹ️ Could not get phone info: ${infoError.response?.status || infoError.message}`);
    }
    
    // Try sending a test message
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: PHONE_NUMBER,
        type: 'text',
        text: {
          preview_url: false,
          body: "🔍 WhatsApp Phone ID Test Message"
        }
      }
    });
    
    console.log(`✅ SUCCESS! Message sent using Phone ID: ${phoneId}`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ Failed with Phone ID ${phoneId}:`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
    return false;
  }
}

// Try to get your correct phone number ID using the WABA ID
async function tryGetPhoneFromWABA() {
  const WABA_ID = "416401061531062"; // Your WhatsApp Business Account ID (Freedom Tech)
  
  console.log(`\n🔍 Trying to find phone number info via WABA graph API...`);
  
  try {
    const wabaInfoResponse = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/v18.0/${WABA_ID}?fields=message_template_namespace,analytics`,
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`✅ WABA info:`, JSON.stringify(wabaInfoResponse.data, null, 2));
    
    // Try another graph API endpoint
    console.log("\nTrying to get phone numbers via graph_node endpoint...");
    try {
      const nodeResponse = await axios({
        method: 'GET',
        url: `https://graph.facebook.com/v18.0/${WABA_ID}?fields=phone_numbers{display_phone_number,verified_name,quality_rating,certificate,code_verification_status,id,name}`,
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      console.log("✅ Node response:", JSON.stringify(nodeResponse.data, null, 2));
      
      if (nodeResponse.data && nodeResponse.data.phone_numbers && nodeResponse.data.phone_numbers.data) {
        const phones = nodeResponse.data.phone_numbers.data;
        console.log(`Found ${phones.length} phone number(s)!`);
        
        if (phones.length > 0) {
          phones.forEach(phone => {
            console.log(`- Phone: ${phone.display_phone_number} (ID: ${phone.id})`);
            // Add this to our candidates list
            if (phone.id && !phoneIdCandidates.includes(phone.id)) {
              phoneIdCandidates.push(phone.id);
            }
          });
        }
      }
    } catch (nodeError) {
      console.log(`❌ Node info error:`, nodeError.response?.data?.error || nodeError.message);
    }
  } catch (wabaError) {
    console.log(`❌ WABA info error:`, wabaError.response?.data?.error || wabaError.message);
  }
}

// Try to find your phone ID using WhatsApp Cloud API methods
async function tryCloudApi() {
  console.log(`\n🔍 Trying to find phone number info via WhatsApp Cloud API...`);
  
  // Try the phone API endpoint
  try {
    const phoneResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/phone',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`✅ Phone API response:`, JSON.stringify(phoneResponse.data, null, 2));
  } catch (phoneError) {
    console.log(`❌ Phone API error:`, phoneError.response?.data?.error || phoneError.message);
  }
  
  // Try the cloud API user endpoint
  try {
    const userResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/user',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`✅ User API response:`, JSON.stringify(userResponse.data, null, 2));
  } catch (userError) {
    console.log(`❌ User API error:`, userError.response?.data?.error || userError.message);
  }
}

// Test app token information
async function getAppInfo() {
  console.log(`\n🔍 Getting app token information...`);
  
  try {
    const debugResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/debug_token',
      params: {
        input_token: TOKEN,
        access_token: TOKEN
      }
    });
    
    console.log(`✅ Token debug info:`, JSON.stringify(debugResponse.data, null, 2));
    
    // Try getting app info
    if (debugResponse.data && debugResponse.data.data && debugResponse.data.data.app_id) {
      const appId = debugResponse.data.data.app_id;
      console.log(`\n🔍 Getting app info for app ID: ${appId}`);
      
      try {
        const appResponse = await axios({
          method: 'GET',
          url: `https://graph.facebook.com/v18.0/${appId}`,
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        });
        
        console.log(`✅ App info:`, JSON.stringify(appResponse.data, null, 2));
      } catch (appError) {
        console.log(`❌ App info error:`, appError.response?.data?.error || appError.message);
      }
    }
  } catch (debugError) {
    console.log(`❌ Token debug error:`, debugError.response?.data?.error || debugError.message);
  }
}

// Run all tests in sequence
async function runTests() {
  console.log("===============================================");
  console.log("WhatsApp Phone ID Tester");
  console.log("===============================================");
  console.log("This script will try multiple potential Phone Number IDs");
  console.log("to find one that works with your WhatsApp API token.");
  console.log("Target phone number:", PHONE_NUMBER);
  console.log("===============================================");
  
  // First try to get info about your WABA and phone numbers
  await tryGetPhoneFromWABA();
  
  // Try cloud API methods
  await tryCloudApi();
  
  // Get token and app info
  await getAppInfo();
  
  // Now test each phone ID candidate
  console.log("\n🔍 Testing all potential Phone Number IDs...");
  
  let foundWorkingId = false;
  for (const phoneId of phoneIdCandidates) {
    const success = await testPhoneId(phoneId);
    if (success) {
      foundWorkingId = true;
      console.log(`\n✅ FOUND WORKING PHONE ID: ${phoneId}`);
      
      // Update the .env file with this phone ID
      const fs = require('fs');
      try {
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace(
          /WHATSAPP_PHONE_NUMBER_ID="(.*?)"/,
          `WHATSAPP_PHONE_NUMBER_ID="${phoneId}"`
        );
        fs.writeFileSync('.env', envContent);
        console.log(`✅ Updated .env file with working Phone Number ID: ${phoneId}`);
      } catch (envError) {
        console.log(`❌ Error updating .env file:`, envError.message);
      }
      
      break;
    }
  }
  
  if (!foundWorkingId) {
    console.log("\n❌ None of the Phone Number IDs worked.");
    console.log("You may need to create a new WhatsApp integration in the Meta Developer Console,");
    console.log("or request the Phone Number ID from your WhatsApp Business Provider.");
  }
  
  console.log("\n===============================================");
  console.log("Testing completed!");
  console.log("===============================================");
}

// Start the tests
runTests().catch(error => {
  console.error("Fatal error:", error);
}); 
/**
 * Facebook Business API Permission Check
 */
require('dotenv').config();
const axios = require('axios');

const token = process.env.WHATSAPP_TOKEN;

console.log("=======================================");
console.log("Facebook Business API Permission Check");
console.log("=======================================");
console.log("Using token ending with:", token ? "..." + token.slice(-4) : "undefined");
console.log("=======================================\n");

async function checkTokenPermissions() {
  try {
    console.log("Checking token debug info...");
    
    // Get token debug info
    const debugResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/debug_token',
      params: {
        input_token: token,
        access_token: token
      }
    });
    
    if (debugResponse.data && debugResponse.data.data) {
      const tokenInfo = debugResponse.data.data;
      console.log("\n✅ Token Information:");
      console.log("- App ID:", tokenInfo.app_id);
      console.log("- Type:", tokenInfo.type);
      console.log("- Application:", tokenInfo.application);
      console.log("- Expires:", tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000).toLocaleString() : "Never");
      console.log("- Valid:", tokenInfo.is_valid ? "Yes" : "No");
      
      if (tokenInfo.scopes) {
        console.log("\n📋 Token Permissions:");
        tokenInfo.scopes.forEach(scope => {
          console.log(`- ${scope}`);
        });
        
        // Check if has WhatsApp Business permissions
        const hasWhatsAppPerm = tokenInfo.scopes.some(s => s.includes('whatsapp'));
        if (!hasWhatsAppPerm) {
          console.log("\n⚠️ WARNING: Your token does not have WhatsApp Business permissions!");
          console.log("Missing required permissions:");
          console.log("- whatsapp_business_management");
          console.log("- whatsapp_business_messaging");
        }
      } else {
        console.log("\n⚠️ Could not determine token permissions");
      }
    }
    
    // Try to get user info
    console.log("\nChecking user info...");
    const userResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("User Info:");
    console.log("- ID:", userResponse.data.id);
    console.log("- Name:", userResponse.data.name);
    
    // Try to get basic business management info to see if user has access
    console.log("\nChecking business info...");
    const businessResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me/businesses',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (businessResponse.data && businessResponse.data.data) {
      console.log("\n✅ Business Accounts:");
      businessResponse.data.data.forEach(business => {
        console.log("- ID:", business.id);
        console.log("  Name:", business.name);
        console.log("  ------------------");
      });
    } else {
      console.log("\n❌ No business accounts found");
    }
    
  } catch (error) {
    console.error("\n❌ Error checking token:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error data:", JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 190) {
        console.log("\n🔑 TOKEN ISSUE: Your token might be invalid or expired.");
      }
    } else {
      console.error(error.message);
    }
  }
  
  console.log("\n=======================================");
  console.log("🔧 NEXT STEPS:");
  console.log("1. Generate a new token with these permissions:");
  console.log("   - whatsapp_business_management");
  console.log("   - whatsapp_business_messaging");
  console.log("   - business_management");
  console.log("2. Update your .env file with the new token");
  console.log("3. Run the quickfix.js script");
  console.log("4. Restart your server");
  console.log("=======================================");
}

// Run the check
checkTokenPermissions(); 
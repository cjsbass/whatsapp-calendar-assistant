/**
 * WhatsApp Business Accounts Explorer
 * This will help find all WA Business Accounts and phone numbers accessible to the user
 */
const axios = require('axios');

// Your token from the previous script
const TOKEN = "EAARahBZAxZBD8BOy8vLD43Rh5ehr7ItZAyZAkOhgMuJToZAff2XPZC8fdl4wTu924Sy6Wvv1ML7ft8MeA4zd7zlNSZBUHCd0E6iIyCZAv4zbmXSdF3LEeLEIRfEjZCamE1tn2eZA4Fhxf2gNRZAZCpQDnSHkSuhsWLXzUZBwLMn3qXdOmBWinrjhi1mLaWM5b94ugxAZDZD";

async function exploreWaba() {
  console.log("===============================================");
  console.log("WhatsApp Business Accounts Explorer");
  console.log("===============================================");
  
  try {
    // Step 1: Get info about the user
    console.log("🔍 Step 1: Getting user info...");
    
    const userResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log("✅ Connected as:", userResponse.data.name || userResponse.data.id);
    
    // Step 2: Get all accounts the user has access to
    console.log("\n🔍 Step 2: Getting all accounts...");
    
    const accountsResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me/accounts',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    if (accountsResponse.data && accountsResponse.data.data) {
      console.log(`Found ${accountsResponse.data.data.length} account(s):`);
      accountsResponse.data.data.forEach(account => {
        console.log(`- ${account.name} (ID: ${account.id})`);
      });
    } else {
      console.log("No accounts found.");
    }
    
    // Step 3: Find all WhatsApp Business Accounts
    console.log("\n🔍 Step 3: Looking for WhatsApp Business Accounts...");
    
    try {
      const wabaResponse = await axios({
        method: 'GET',
        url: 'https://graph.facebook.com/v18.0/me/whatsapp_business_accounts',
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      if (wabaResponse.data && wabaResponse.data.data) {
        console.log(`Found ${wabaResponse.data.data.length} WhatsApp Business Account(s):`);
        
        // For each WABA, try to get phone numbers
        for (const waba of wabaResponse.data.data) {
          console.log(`\n📱 WABA: ${waba.name || waba.id} (ID: ${waba.id})`);
          
          try {
            const phonesResponse = await axios({
              method: 'GET',
              url: `https://graph.facebook.com/v18.0/${waba.id}/phone_numbers`,
              headers: {
                'Authorization': `Bearer ${TOKEN}`
              }
            });
            
            if (phonesResponse.data && phonesResponse.data.data) {
              console.log(`  Found ${phonesResponse.data.data.length} phone number(s):`);
              
              phonesResponse.data.data.forEach(phone => {
                console.log(`  - ${phone.display_phone_number || "Unknown"} (ID: ${phone.id})`);
                console.log(`    Status: ${phone.status || "Unknown"}`);
                console.log(`    Verified name: ${phone.verified_name || "Not verified"}`);
                console.log(`    Quality rating: ${phone.quality_rating || "Unknown"}`);
              });
            } else {
              console.log("  No phone numbers found for this WABA.");
            }
          } catch (phoneError) {
            console.log(`  ❌ Error getting phones for WABA ${waba.id}:`);
            if (phoneError.response) {
              console.log(`  Status: ${phoneError.response.status}`);
              console.log(`  Message: ${phoneError.response.data.error?.message || JSON.stringify(phoneError.response.data)}`);
            } else {
              console.log(`  Error: ${phoneError.message}`);
            }
          }
        }
      } else {
        console.log("No WhatsApp Business Accounts found.");
      }
    } catch (wabaError) {
      console.log("❌ Error getting WhatsApp Business Accounts:");
      if (wabaError.response) {
        console.log(`Status: ${wabaError.response.status}`);
        console.log(`Message: ${wabaError.response.data.error?.message || JSON.stringify(wabaError.response.data)}`);
        
        // If permission error, try another approach
        if (wabaError.response.status === 403) {
          // Try getting all businesses
          await exploreAllBusinesses();
        }
      } else {
        console.log(`Error: ${wabaError.message}`);
      }
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
    }
  }
}

// Helper function to explore all businesses
async function exploreAllBusinesses() {
  console.log("\n🔍 Attempting alternative approach: Getting all businesses...");
  
  try {
    const bizResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me/businesses',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    if (bizResponse.data && bizResponse.data.data) {
      console.log(`Found ${bizResponse.data.data.length} business(es):`);
      
      // For each business, try to find associated WA Business Accounts
      for (const biz of bizResponse.data.data) {
        console.log(`\n🏢 Business: ${biz.name} (ID: ${biz.id})`);
        
        try {
          // Try to get WABAs for this business
          const bizWabaResponse = await axios({
            method: 'GET',
            url: `https://graph.facebook.com/v18.0/${biz.id}/owned_whatsapp_business_accounts`,
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          });
          
          if (bizWabaResponse.data && bizWabaResponse.data.data) {
            console.log(`  Found ${bizWabaResponse.data.data.length} WhatsApp Business Account(s):`);
            
            for (const waba of bizWabaResponse.data.data) {
              console.log(`  - WABA ID: ${waba.id}`);
              
              // Try to get phone numbers for this WABA
              try {
                const phonesResponse = await axios({
                  method: 'GET',
                  url: `https://graph.facebook.com/v18.0/${waba.id}/phone_numbers`,
                  headers: {
                    'Authorization': `Bearer ${TOKEN}`
                  }
                });
                
                if (phonesResponse.data && phonesResponse.data.data) {
                  console.log(`    Found ${phonesResponse.data.data.length} phone number(s):`);
                  
                  phonesResponse.data.data.forEach(phone => {
                    console.log(`    - ${phone.display_phone_number || "Unknown"} (ID: ${phone.id})`);
                  });
                } else {
                  console.log("    No phone numbers found for this WABA.");
                }
              } catch (phoneError) {
                console.log(`    ❌ Error getting phones for WABA ${waba.id}:`);
                if (phoneError.response) {
                  console.log(`    Status: ${phoneError.response.status}`);
                  console.log(`    Message: ${phoneError.response.data.error?.message || "Unknown error"}`);
                } else {
                  console.log(`    Error: ${phoneError.message}`);
                }
              }
            }
          } else {
            console.log("  No WhatsApp Business Accounts found for this business.");
          }
        } catch (bizWabaError) {
          console.log(`  ❌ Error getting WABAs for business ${biz.id}:`);
          if (bizWabaError.response) {
            console.log(`  Status: ${bizWabaError.response.status}`);
            console.log(`  Message: ${bizWabaError.response.data.error?.message || "Unknown error"}`);
          } else {
            console.log(`  Error: ${bizWabaError.message}`);
          }
        }
      }
    } else {
      console.log("No businesses found.");
    }
  } catch (bizError) {
    console.log("❌ Error getting businesses:");
    if (bizError.response) {
      console.log(`Status: ${bizError.response.status}`);
      console.log(`Message: ${bizError.response.data.error?.message || JSON.stringify(bizError.response.data)}`);
    } else {
      console.log(`Error: ${bizError.message}`);
    }
    
    // Try business assets as a last resort
    await checkAppAndAssets();
  }
}

// Helper function to check app details
async function checkAppAndAssets() {
  console.log("\n🔍 Final approach: Checking app details and assets...");
  
  try {
    // Get app info
    const appResponse = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v18.0/me/apps',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    if (appResponse.data && appResponse.data.data) {
      console.log(`Found ${appResponse.data.data.length} app(s):`);
      
      for (const app of appResponse.data.data) {
        console.log(`- ${app.name} (ID: ${app.id})`);
      }
    } else {
      console.log("No apps found.");
    }
    
    // Try getting system users
    try {
      const systemUserResponse = await axios({
        method: 'GET',
        url: 'https://graph.facebook.com/v18.0/me/business_users',
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      if (systemUserResponse.data && systemUserResponse.data.data) {
        console.log(`\nFound ${systemUserResponse.data.data.length} system user(s):`);
        
        for (const user of systemUserResponse.data.data) {
          console.log(`- ${user.name || user.id} (ID: ${user.id})`);
        }
      } else {
        console.log("\nNo system users found.");
      }
    } catch (userError) {
      console.log("\n❌ Error getting system users:");
      if (userError.response) {
        console.log(`Status: ${userError.response.status}`);
        console.log(`Message: ${userError.response.data.error?.message || "Unknown error"}`);
      } else {
        console.log(`Error: ${userError.message}`);
      }
    }
  } catch (appError) {
    console.log("❌ Error getting app info:");
    if (appError.response) {
      console.log(`Status: ${appError.response.status}`);
      console.log(`Message: ${appError.response.data.error?.message || JSON.stringify(appError.response.data)}`);
    } else {
      console.log(`Error: ${appError.message}`);
    }
  }
  
  console.log("\n===============================================");
  console.log("CONFIGURATION RECOMMENDATION:");
  console.log("Try directly creating a new WhatsApp integration from the");
  console.log("Meta Developer Dashboard. This will create a new Phone Number ID.");
  console.log("===============================================");
}

// Run the explorer
exploreWaba().catch(error => {
  console.error("Fatal error:", error);
}); 
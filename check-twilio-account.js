const twilio = require('twilio');
require('dotenv').config();

// Your Twilio credentials - loaded from environment variables for security
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkAccount() {
  console.log("===============================================");
  console.log("🔍 CHECKING TWILIO ACCOUNT STATUS");
  console.log("===============================================");
  
  try {
    // Get account info
    const account = await client.api.accounts(accountSid).fetch();
    console.log("✅ Account Status:", account.status);
    console.log("✅ Account Type:", account.type);
    console.log("✅ Account SID:", account.sid);
    console.log("✅ Date Created:", account.dateCreated);
    
    // Check available services
    console.log("\n📱 CHECKING AVAILABLE SERVICES:");
    
    // Check if WhatsApp is available
    try {
      const services = await client.messaging.v1.services.list();
      console.log("✅ Messaging services available:", services.length);
    } catch (error) {
      console.log("❌ Messaging services:", error.message);
    }
    
    // Check phone numbers
    console.log("\n📞 CHECKING PHONE NUMBERS:");
    try {
      const phoneNumbers = await client.incomingPhoneNumbers.list();
      console.log("✅ Phone numbers owned:", phoneNumbers.length);
      phoneNumbers.forEach((number, index) => {
        console.log(`   ${index + 1}. ${number.phoneNumber} (${number.capabilities.sms ? 'SMS' : 'No SMS'}, ${number.capabilities.voice ? 'Voice' : 'No Voice'})`);
      });
    } catch (error) {
      console.log("❌ Phone numbers:", error.message);
    }
    
    // Check account balance
    console.log("\n💰 CHECKING ACCOUNT BALANCE:");
    try {
      const balance = await client.balance.fetch();
      console.log("✅ Account Balance:", balance.balance, balance.currency);
    } catch (error) {
      console.log("❌ Balance check:", error.message);
    }
    
    console.log("\n===============================================");
    console.log("NEXT STEPS FOR WHATSAPP:");
    console.log("===============================================");
    
    if (account.status === 'active') {
      console.log("✅ Your account is ACTIVE and ready for WhatsApp setup!");
      console.log("📋 To set up live WhatsApp, we need to:");
      console.log("   1. Request a WhatsApp-enabled phone number");
      console.log("   2. Submit business verification documents");
      console.log("   3. Wait for Meta/WhatsApp approval (1-5 business days)");
    } else if (account.status === 'trial') {
      console.log("⚠️  Your account is in TRIAL mode");
      console.log("📋 For live WhatsApp, you'll need to:");
      console.log("   1. Upgrade to a paid account first");
      console.log("   2. Add billing information");
      console.log("   3. Then request WhatsApp capabilities");
    }
    
    console.log("===============================================");
    
  } catch (error) {
    console.error("❌ Error checking account:", error.message);
    
    if (error.code === 20003) {
      console.log("❌ Authentication failed - please check your credentials");
    }
  }
}

checkAccount(); 
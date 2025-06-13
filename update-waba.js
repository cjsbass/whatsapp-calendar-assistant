/**
 * Quick WhatsApp Business Account Update Script
 */
const fs = require('fs');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values - UPDATE THESE WITH YOUR INFO
const CONFIG = {
  // Pre-populated business account ID from the screenshot
  wabaId: "416401061531062", // Freedom Tech
  phoneNumberId: "", // Add your Phone Number ID here from WhatsApp Business API dashboard
  phoneNumber: "", // Your full phone number with country code (e.g., +15551234567)
  token: "", // Add a token with whatsapp_business_messaging permission
};

// Ask a question and get the answer
function askQuestion(question, defaultValue = '') {
  const displayQuestion = defaultValue 
    ? `${question} (default: ${defaultValue.replace(/^(\+?\d{1,4})(\d{3})(\d{3})(\d{4})$/, '$1****$4')}): ` 
    : `${question}: `;
  
  return new Promise(resolve => {
    rl.question(displayQuestion, answer => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Save the configuration for future use
function saveConfig(config) {
  try {
    fs.writeFileSync('.waba-config.json', JSON.stringify(config, null, 2));
    console.log("✅ Saved configuration for future use");
  } catch (error) {
    console.log("❌ Failed to save configuration:", error.message);
  }
}

// Load saved configuration if available
function loadConfig() {
  try {
    if (fs.existsSync('.waba-config.json')) {
      const savedConfig = JSON.parse(fs.readFileSync('.waba-config.json', 'utf8'));
      
      // Update CONFIG with saved values
      CONFIG.phoneNumberId = savedConfig.phoneNumberId || CONFIG.phoneNumberId;
      CONFIG.phoneNumber = savedConfig.phoneNumber || CONFIG.phoneNumber;
      CONFIG.token = savedConfig.token || CONFIG.token;
      
      console.log("ℹ️ Loaded saved configuration");
      return true;
    }
  } catch (error) {
    console.log("ℹ️ No saved configuration found or error loading it");
  }
  return false;
}

async function updateWABA() {
  console.log("===============================================");
  console.log("WhatsApp Business Account Update Tool");
  console.log("===============================================\n");
  
  // Load saved configuration
  loadConfig();
  
  console.log(`Using WhatsApp Business Account ID: ${CONFIG.wabaId} (Freedom Tech)`);
  
  // Get the phone number ID from the user (with default if available)
  const phoneNumberId = await askQuestion("Enter your Phone Number ID from the WhatsApp API setup page", CONFIG.phoneNumberId);
  
  // Get the WhatsApp phone number (with default if available)
  const phoneNumber = await askQuestion("Enter your WhatsApp phone number (with country code, e.g., +15551508797)", CONFIG.phoneNumber);
  
  // Get new token if available
  let newToken = CONFIG.token;
  if (!newToken) {
    console.log("\nDo you have a new WhatsApp token with 'whatsapp_business_messaging' permission?");
    const hasNewToken = await askQuestion("Enter 'yes' if you have a new token, or 'no' to use existing token");
    
    if (hasNewToken.toLowerCase() === 'yes' || hasNewToken.toLowerCase() === 'y') {
      newToken = await askQuestion("Enter your new WhatsApp API token");
    }
  } else {
    const useExistingToken = await askQuestion(`Use saved token (ends with '${newToken.slice(-4)}')? (yes/no)`, "yes");
    if (useExistingToken.toLowerCase() !== 'yes' && useExistingToken.toLowerCase() !== 'y') {
      newToken = await askQuestion("Enter your new WhatsApp API token");
    }
  }
  
  // Save the configuration for future use
  const shouldSaveConfig = await askQuestion("Save this configuration for future use? (yes/no)", "yes");
  if (shouldSaveConfig.toLowerCase() === 'yes' || shouldSaveConfig.toLowerCase() === 'y') {
    saveConfig({
      wabaId: CONFIG.wabaId,
      phoneNumberId: phoneNumberId,
      phoneNumber: phoneNumber,
      token: newToken
    });
  }
  
  // Read current .env file
  let envContent;
  try {
    envContent = fs.readFileSync('.env', 'utf8');
    console.log("Loaded existing .env file");
  } catch (err) {
    console.log("Creating new .env file");
    envContent = "";
  }
  
  // Parse current .env file
  const envLines = envContent.split('\n');
  const envVars = {};
  
  envLines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
  
  // Update WABA information
  envVars['WHATSAPP_BUSINESS_ACCOUNT_ID'] = `"${CONFIG.wabaId}"`;
  envVars['WHATSAPP_PHONE_NUMBER_ID'] = `"${phoneNumberId}"`;
  envVars['WHATSAPP_PHONE_NUMBER'] = `"${phoneNumber.replace('+', '')}"`;
  
  // Update token if provided
  if (newToken) {
    envVars['WHATSAPP_TOKEN'] = `"${newToken}"`;
  }
  
  // Ensure other required variables exist
  if (!envVars['PORT']) envVars['PORT'] = "3000";
  if (!envVars['WHATSAPP_VERIFY_TOKEN']) envVars['WHATSAPP_VERIFY_TOKEN'] = `"d06bfb2ab638cd9c34ba1e9f2f11e66a"`;
  if (!envVars['GOOGLE_APPLICATION_CREDENTIALS']) envVars['GOOGLE_APPLICATION_CREDENTIALS'] = `"credentials/google-credentials.json"`;
  if (!envVars['BASE_URL']) envVars['BASE_URL'] = `"https://apt-reindeer-quickly.ngrok-free.app"`;
  if (!envVars['NODE_ENV']) envVars['NODE_ENV'] = `"development"`;
  if (!envVars['APP_SECRET']) envVars['APP_SECRET'] = `"424d04665932011529ae67b9cf6d8bac"`;
  
  // Create new .env content
  let newEnvContent = `# Server Config\n`;
  newEnvContent += `# Updated by WABA update tool on ${new Date().toISOString()}\n\n`;
  
  // Add all variables
  for (const [key, value] of Object.entries(envVars)) {
    newEnvContent += `${key}=${value}\n`;
  }
  
  // Write to .env.new first
  fs.writeFileSync('.env.new', newEnvContent);
  console.log("Created new configuration file at .env.new");
  
  const confirmUpdate = await askQuestion("\nDo you want to update your .env file with the new configuration? (yes/no)", "yes");
  if (confirmUpdate.toLowerCase() === 'yes' || confirmUpdate.toLowerCase() === 'y') {
    fs.renameSync('.env.new', '.env');
    console.log("✅ .env file updated successfully!");
    
    // Update direct-fix.js if token was changed
    if (newToken) {
      try {
        const directFixContent = fs.readFileSync('src/direct-fix.js', 'utf8');
        const updatedDirectFix = directFixContent.replace(
          /const realToken = "(.*?)";/,
          `const realToken = "${newToken}";`
        );
        
        // Write to a new file first
        fs.writeFileSync('src/direct-fix.js.new', updatedDirectFix);
        console.log("Created new direct-fix.js.new file");
        
        const confirmDirectFix = await askQuestion("\nDo you want to update direct-fix.js with the new token? (yes/no)", "yes");
        if (confirmDirectFix.toLowerCase() === 'yes' || confirmDirectFix.toLowerCase() === 'y') {
          fs.renameSync('src/direct-fix.js.new', 'src/direct-fix.js');
          console.log("✅ direct-fix.js updated successfully!");
        } else {
          console.log("New file saved as src/direct-fix.js.new. You can manually update the file.");
        }
      } catch (directFixError) {
        console.log("❌ Error updating direct-fix.js:", directFixError.message);
      }
    }
  } else {
    console.log("Configuration file saved as .env.new. You can manually update your .env file.");
  }
  
  console.log("\nWould you like to restart the server now?");
  const restartServer = await askQuestion("Enter 'yes' to restart server or 'no' to restart later", "yes");
  
  if (restartServer.toLowerCase() === 'yes' || restartServer.toLowerCase() === 'y') {
    console.log("\nRestarting server...");
    console.log("Stopping any running node processes...");
    require('child_process').execSync('pkill -f "node src/index.js"', { stdio: 'inherit' });
    
    console.log("Starting server...");
    require('child_process').exec('nohup npm start > server.log 2>&1 &', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting server: ${error.message}`);
        return;
      }
      console.log("✅ Server restarted successfully!");
    });
  }
  
  console.log("\n===============================================");
  console.log("Configuration update completed!");
  console.log("WhatsApp Business Account ID: 416401061531062 (Freedom Tech)");
  console.log("Phone Number ID:", phoneNumberId);
  console.log("WhatsApp Number:", phoneNumber);
  console.log("===============================================");
  
  rl.close();
}

// Run the update
updateWABA().catch(error => {
  console.error("Setup failed:", error.message);
  rl.close();
}); 
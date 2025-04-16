#!/bin/bash

# This script sets up ngrok with a premium account and a reserved domain
# You'll need to replace YOUR_AUTH_TOKEN and YOUR_RESERVED_DOMAIN with your actual values

# Step 1: Install ngrok (if not already installed)
# macOS: brew install ngrok
# Linux: snap install ngrok
# Or download from https://ngrok.com/download

# Step 2: Add your authtoken (replace with your actual token from ngrok dashboard)
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Step 3: Create a configuration file
cat > ngrok-config.yml << EOL
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  whatsapp-calendar:
    proto: http
    addr: 3000
    domain: YOUR_RESERVED_DOMAIN.ngrok.io
EOL

# Step 4: Start ngrok with your custom domain (replace with your actual domain)
echo "Starting ngrok with custom domain..."
ngrok start --config=ngrok-config.yml whatsapp-calendar 
const express = require('express');
const router = express.Router();
const whatsappRoutes = require('./whatsapp.routes');
const twilioRoutes = require('./twilio.routes');
const shortUrlService = require('../services/shorturl.service');

// WhatsApp webhook routes (legacy Meta API)
router.use('/api/webhook', whatsappRoutes);

// Twilio WhatsApp webhook routes
router.use('/api/twilio', twilioRoutes);

// URL Shortener redirect route
router.get('/r/:shortId', (req, res) => {
  const { shortId } = req.params;
  
  if (!shortId) {
    return res.status(400).send('Invalid URL');
  }
  
  const longUrl = shortUrlService.getLongUrl(shortId);
  
  if (!longUrl) {
    return res.status(404).send('URL not found');
  }
  
  // Log the redirect
  console.log(`Redirecting ${shortId} to ${longUrl.substring(0, 100)}...`);
  
  // Redirect to the original URL
  return res.redirect(longUrl);
});

// Home route
router.get('/', (req, res) => {
  res.send('Kairos AI Calendar Assistant is running! (Now using Twilio for WhatsApp integration)');
});

module.exports = router; 
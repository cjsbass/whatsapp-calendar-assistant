const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/twilio.controller');

// POST request for receiving Twilio webhook messages
router.post('/', twilioController.receiveMessage);

module.exports = router; 
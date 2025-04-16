const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');

// GET request for webhook verification
router.get('/', whatsappController.verifyWebhook);

// POST request for receiving messages
router.post('/', whatsappController.receiveMessage);

module.exports = router; 
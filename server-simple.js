const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🆕 KAIROS - Starting Simplified Express Server for Railway');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'Kairos AI Calendar Assistant',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Home route
app.get('/', (req, res) => {
  res.send('✅ Kairos AI Calendar Assistant is running! (Twilio Integration)');
});

// Twilio webhook endpoint (simplified)
app.post('/api/twilio', (req, res) => {
  console.log('📞 Twilio webhook received:', req.body);
  
  // Simple response for now
  res.status(200).send('OK');
  
  // Log webhook data
  const messageType = req.body.MediaContentType0 ? 'media' : 'text';
  const senderPhone = req.body.From ? req.body.From.replace('whatsapp:', '') : '';
  const messageBody = req.body.Body || '';
  
  console.log(`Received ${messageType} message from ${senderPhone}: ${messageBody}`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kairos server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📞 Twilio webhook: http://localhost:${PORT}/api/twilio`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
}); 
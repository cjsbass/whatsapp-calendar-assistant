const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import our existing routes
const routes = require('./src/routes/index');

console.log('🆕 KAIROS - Starting Express Server for Railway');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use our existing routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'Kairos AI Calendar Assistant',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kairos server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📞 Twilio webhook: http://localhost:${PORT}/api/twilio`);
}); 
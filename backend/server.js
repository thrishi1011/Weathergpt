require('dotenv').config();

const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weather');
const askRoutes = require('./routes/ask');
const locationRoutes = require('./routes/location');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'WeatherGPT Backend' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WeatherGPT Backend' });
});

// API routes
app.use('/api/weather', weatherRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/location', locationRoutes);

// Global error handler — catches unhandled errors so the server never crashes silently
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WeatherGPT Backend running on port ${PORT}`);
  });
}

module.exports = app;

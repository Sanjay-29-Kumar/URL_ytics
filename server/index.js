import './config/env.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import apiRouter from './routes/index.js';
import { handleRedirect, handlePasswordUnlock } from './controllers/redirectController.js';
import { redirectRateLimiter, apiRateLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate-limited public short URL redirection
app.get('/r/:shortCode', redirectRateLimiter, handleRedirect);

// Password unlock endpoint for protected links
app.post('/r/:shortCode/unlock', redirectRateLimiter, handlePasswordUnlock);

// Rate-limited API Routes
app.use('/api', apiRateLimiter, apiRouter);

// Health check endpoint for UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback for root route (helpful for general uptime checking)
app.get('/', (req, res) => {
  res.status(200).send('URLytics Backend API is running.');
});

// Start Express HTTP Server
app.listen(PORT, () => {
  console.log(`URLytics backend server running on port ${PORT}`);
});

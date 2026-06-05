import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

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

// Serve static assets from the Vite build directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all for unknown routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API Endpoint not found' });
  }
  
  // Fallback to index.html for client-side SPA routing (React Router)
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`URLytics backend server running on port ${PORT}`);
});

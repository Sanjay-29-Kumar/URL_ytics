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
import { handleRedirect } from './controllers/redirectController.js';

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

// Public short URL redirection route
app.get('/r/:shortCode', handleRedirect);

// API Routes
app.use('/api', apiRouter);


// Serve static assets in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback middleware to serve React SPA for other routes
app.use((req, res, next) => {
  // If it's API or redirection, skip and let Express handle 404
  if (req.path.startsWith('/api') || req.path.startsWith('/r/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`URLytics backend server running on port ${PORT}`);
});
